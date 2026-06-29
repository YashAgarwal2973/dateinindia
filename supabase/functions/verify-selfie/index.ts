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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  try {
    const { user_id, image_base64 } = await req.json();

    if (!user_id || !image_base64) {
      return respond({ error: "user_id and image_base64 are required" }, 400);
    }

    if (image_base64.length > 2_000_000) {
      return respond({ error: "Image too large. Please use a smaller photo (under 1.5 MB)." }, 400);
    }

    const appId  = Deno.env.get("HYPERVERGE_APP_ID");
    const appKey = Deno.env.get("HYPERVERGE_APP_KEY");

    let livenessApproved = false;
    let devMode = false;

    if (!appId || !appKey) {
      // ── DEV MODE: no credentials → auto-approve ─────────────────────────
      console.warn("HYPERVERGE_APP_ID / HYPERVERGE_APP_KEY not set — running in dev mode");
      devMode = true;
      livenessApproved = true;
    } else {
      // ── PRODUCTION: call HyperVerge face liveness API ────────────────────
      // Docs: https://developer.hyperverge.co/face-verification/face-liveness
      const hvRes = await fetch(
        "https://ind-prod.hyperverge.co/v1/photo/verifyFaceLiveness",
        {
          method: "POST",
          headers: {
            "appId": appId,
            "appKey": appKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputImageFile: image_base64 }),
        },
      );

      if (!hvRes.ok) {
        const errBody = await hvRes.text();
        console.error("HyperVerge API error:", hvRes.status, errBody);
        return respond({ error: "Liveness check service unavailable. Please try again." }, 503);
      }

      const hvData = await hvRes.json();

      // HyperVerge returns { status: "success", result: { details: { liveness: { live: true, confidence: 0.99 } } } }
      const liveness = hvData?.result?.details?.liveness ?? hvData?.result?.details?.face;
      const isLive       = liveness?.live  !== false;
      const confidence   = liveness?.confidence ?? 0;

      livenessApproved = hvData?.status === "success" && isLive && confidence >= 0.75;

      if (!livenessApproved) {
        return respond({
          success: false,
          error: "Liveness check failed. Please ensure good lighting and that your face is clearly visible, then try again.",
          debug: { isLive, confidence },
        }, 400);
      }
    }

    // ── Update verifications table ───────────────────────────────────────
    const { error: verifError } = await adminClient
      .from("verifications")
      .upsert(
        {
          user_id,
          verification_type: "selfie",
          status: "approved",
          provider: devMode ? "dev_mode" : "hyperverge",
          verified_at: new Date().toISOString(),
        },
        { onConflict: "user_id,verification_type" },
      );

    if (verifError) {
      console.error("verifications upsert error:", verifError);
      return respond({ error: "Failed to save verification" }, 500);
    }

    // ── Update users: selfie_verified + trust_score ──────────────────────
    const { data: currentUser, error: fetchErr } = await adminClient
      .from("users")
      .select("trust_score")
      .eq("id", user_id)
      .single();

    if (fetchErr || !currentUser) {
      return respond({ error: "User not found" }, 404);
    }

    const SELFIE_BONUS = 15;
    const newTrustScore = Math.min(100, (currentUser.trust_score ?? 0) + SELFIE_BONUS);

    await adminClient
      .from("users")
      .update({ selfie_verified: true, trust_score: newTrustScore })
      .eq("id", user_id);

    return respond({
      success: true,
      dev_mode: devMode,
      trust_score_increase: SELFIE_BONUS,
      new_trust_score: newTrustScore,
    }, 200);

  } catch (err) {
    console.error("verify-selfie error:", err);
    return respond({ error: "Internal server error" }, 500);
  }
});
