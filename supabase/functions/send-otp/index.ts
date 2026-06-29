import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OTP_TTL_MINUTES = 10;

async function sendViaMSG91(phone: string, code: string): Promise<void> {
  const authKey = Deno.env.get("MSG91_AUTH_KEY")!;
  const route = Deno.env.get("MSG91_ROUTE") || "4";
  const sender = Deno.env.get("MSG91_SENDER") || "DATEIN";

  const message = `${code} is your DateInIndia verification code. Valid for ${OTP_TTL_MINUTES} minutes. Do not share this with anyone.`;

  const params = new URLSearchParams({
    authkey: authKey,
    mobiles: `91${phone}`,
    message,
    route,
    sender,
    country: "91",
  });

  const res = await fetch(
    `https://api.msg91.com/api/sendhttp.php?${params.toString()}`,
    { method: "GET" }
  );

  const text = await res.text();

  // MSG91 returns plain text: starts with "success" on success
  if (!text.toLowerCase().startsWith("success")) {
    throw new Error(`MSG91 error: ${text}`);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      return new Response(
        JSON.stringify({ error: "Enter a valid 10-digit Indian mobile number." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Rate-limit: max 3 OTP requests per phone per 10 minutes
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await adminClient
      .from("otp_codes")
      .select("*", { count: "exact", head: true })
      .eq("phone", phone)
      .gte("created_at", tenMinsAgo);

    if (count !== null && count >= 3) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait 10 minutes before trying again." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const otpId = crypto.randomUUID();
    const msg91AuthKey = Deno.env.get("MSG91_AUTH_KEY");
    const isMock = !msg91AuthKey || Deno.env.get("MOCK_OTP") === "true";
    const code = isMock
      ? "123456"
      : Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

    const { error: insertError } = await adminClient.from("otp_codes").insert({
      phone,
      code,
      otp_id: otpId,
      expires_at: expiresAt,
      used: false,
    });

    if (insertError) throw insertError;

    if (!isMock) {
      try {
        await sendViaMSG91(phone, code);
      } catch (smsErr) {
        // Roll back the OTP record so the user can retry
        await adminClient.from("otp_codes").delete().eq("otp_id", otpId);
        console.error("MSG91 delivery failed:", smsErr);
        return new Response(
          JSON.stringify({ error: "SMS delivery failed. Please try again." }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        otp_id: otpId,
        // Only expose code when in mock/dev mode — never in production
        ...(isMock && { dev_code: code }),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-otp error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
