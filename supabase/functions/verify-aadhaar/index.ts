import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const adminClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const respond = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ── HyperVerge OKYC helper ────────────────────────────────────────────────

async function hvPost(path: string, body: Record<string, unknown>, appId: string, appKey: string) {
  // Docs: https://developer.hyperverge.co/aadhaar/aadhaar-okyc
  const res = await fetch(`https://ind-prod.hyperverge.co/v1${path}`, {
    method: "POST",
    headers: {
      "appId": appId,
      "appKey": appKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

// ── Main handler ──────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const { action, user_id } = body;

    if (!user_id) return respond({ error: "user_id is required" }, 400);

    const appId  = Deno.env.get("HYPERVERGE_APP_ID");
    const appKey = Deno.env.get("HYPERVERGE_APP_KEY");
    const devMode = !appId || !appKey;

    if (devMode) {
      console.warn("HYPERVERGE credentials not set — running in dev mode");
    }

    // ── Step 1: Initiate OKYC ─────────────────────────────────────────────
    if (action === "initiate") {
      const { aadhaar_number, consent } = body;

      if (!aadhaar_number || aadhaar_number.replace(/\s/g, "").length !== 12) {
        return respond({ error: "Valid 12-digit Aadhaar number is required" }, 400);
      }
      if (!consent) {
        return respond({ error: "Consent is required for Aadhaar verification" }, 400);
      }

      if (devMode) {
        // In dev mode, return a fake transaction ID so the OTP step can proceed
        return respond({ success: true, dev_mode: true, transaction_id: "DEV_TXN_" + Date.now() }, 200);
      }

      const { ok, data } = await hvPost(
        "/aadhaar-okyc/initiate",
        { aadhaarNumber: aadhaar_number.replace(/\s/g, ""), consent: "Y" },
        appId!,
        appKey!,
      );

      if (!ok || data?.status !== "success") {
        console.error("HyperVerge initiate error:", data);
        return respond({
          error: data?.result?.error ?? "Aadhaar verification initiation failed. Please check your Aadhaar number and try again.",
        }, 400);
      }

      const transactionId = data?.result?.details?.transactionId;
      if (!transactionId) return respond({ error: "No transaction ID returned by verification service" }, 500);

      return respond({ success: true, transaction_id: transactionId }, 200);
    }

    // ── Step 2: Verify OTP ────────────────────────────────────────────────
    if (action === "verify-otp") {
      const { transaction_id, otp } = body;

      if (!transaction_id) return respond({ error: "transaction_id is required" }, 400);
      if (!otp || otp.length < 4) return respond({ error: "OTP is required" }, 400);

      if (devMode) {
        // In dev mode, OTP "000000" always succeeds; anything else fails
        if (otp !== "000000") {
          return respond({ success: false, error: "Invalid OTP. (Dev mode: use 000000)" }, 400);
        }
      } else {
        const { ok, data } = await hvPost(
          "/aadhaar-okyc/verify-otp",
          { transactionId: transaction_id, otp },
          appId!,
          appKey!,
        );

        if (!ok || data?.status !== "success") {
          console.error("HyperVerge OTP verify error:", data);
          return respond({
            error: data?.result?.error ?? "Invalid OTP. Please try again.",
          }, 400);
        }
      }

      // ── Update verifications table ──────────────────────────────────────
      const { error: verifError } = await adminClient
        .from("verifications")
        .upsert(
          {
            user_id,
            verification_type: "aadhaar",
            status: "approved",
            provider: devMode ? "dev_mode" : "hyperverge_okyc",
            verified_at: new Date().toISOString(),
          },
          { onConflict: "user_id,verification_type" },
        );

      if (verifError) {
        console.error("verifications upsert error:", verifError);
        return respond({ error: "Failed to save verification" }, 500);
      }

      // ── Update users: aadhaar_verified + trust_score ────────────────────
      const { data: currentUser, error: fetchErr } = await adminClient
        .from("users")
        .select("trust_score")
        .eq("id", user_id)
        .single();

      if (fetchErr || !currentUser) return respond({ error: "User not found" }, 404);

      const AADHAAR_BONUS = 30;
      const newTrustScore = Math.min(100, (currentUser.trust_score ?? 0) + AADHAAR_BONUS);

      await adminClient
        .from("users")
        .update({ aadhaar_verified: true, trust_score: newTrustScore })
        .eq("id", user_id);

      return respond({
        success: true,
        dev_mode: devMode,
        trust_score_increase: AADHAAR_BONUS,
        new_trust_score: newTrustScore,
      }, 200);
    }

    return respond({ error: "Invalid action. Use 'initiate' or 'verify-otp'" }, 400);

  } catch (err) {
    console.error("verify-aadhaar error:", err);
    return respond({ error: "Internal server error" }, 500);
  }
});
