import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const message = `${orderId}|${paymentId}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const rawSig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );
  const computed = Array.from(new Uint8Array(rawSig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return computed === signature;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { order_id, payment_id, signature, user_id, tier, billing_period, amount_paise } =
      await req.json();

    if (!order_id || !payment_id || !signature || !user_id || !tier) {
      return new Response(JSON.stringify({ success: false, error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const razorpaySecret = Deno.env.get("RAZORPAY_SECRET_KEY");
    if (!razorpaySecret) {
      return new Response(
        JSON.stringify({ success: false, error: "Razorpay not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify HMAC signature — must match before touching DB
    const valid = await verifyRazorpaySignature(order_id, payment_id, signature, razorpaySecret);
    if (!valid) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid payment signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role to bypass RLS for payment write
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const billingPeriod = billing_period || "monthly";
    const durationMs = billingPeriod === "weekly"
      ? 7 * 24 * 60 * 60 * 1000
      : 30 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + durationMs).toISOString();

    // Mark user premium
    const { error: userErr } = await supabase
      .from("users")
      .update({
        is_premium: true,
        premium_tier: tier,
        premium_expires_at: expiresAt,
      })
      .eq("id", user_id);

    if (userErr) throw userErr;

    // Record subscription
    await supabase.from("subscriptions").insert({
      user_id,
      tier,
      billing_period: billingPeriod,
      amount_paise: amount_paise || 0,
      status: "active",
      starts_at: new Date().toISOString(),
      expires_at: expiresAt,
      razorpay_order_id: order_id,
      razorpay_payment_id: payment_id,
    });

    return new Response(JSON.stringify({ success: true, expires_at: expiresAt }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[verify-payment]", err);
    return new Response(
      JSON.stringify({ success: false, error: "Verification failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
