import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MAX_ATTEMPTS = 5;

async function deriveInternalPassword(userId: string, serviceKey: string): Promise<string> {
  const raw = `${userId}:${serviceKey.slice(-20)}`;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex.slice(0, 32) + "Aa1!";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const respond = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const { otp_id, code, phone, name } = await req.json();

    if (!otp_id || !code || !phone) {
      return respond({ error: "otp_id, code, and phone are required" }, 400);
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // 1. Look up OTP record
    const { data: otpRecord, error: otpError } = await adminClient
      .from("otp_codes")
      .select("code, expires_at, used, phone, failed_attempts")
      .eq("otp_id", otp_id)
      .eq("used", false)
      .single();

    if (otpError || !otpRecord) {
      return respond({ error: "Invalid or expired OTP. Please request a new one." }, 400);
    }

    if (otpRecord.phone !== phone) {
      return respond({ error: "Phone number mismatch." }, 400);
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      return respond({ error: "OTP has expired. Please request a new one." }, 400);
    }

    // 2. Brute-force guard
    const attempts: number = otpRecord.failed_attempts ?? 0;
    if (attempts >= MAX_ATTEMPTS) {
      await adminClient.from("otp_codes").update({ used: true }).eq("otp_id", otp_id);
      return respond({ error: "Too many incorrect attempts. Please request a new OTP." }, 429);
    }

    if (otpRecord.code !== code) {
      const newAttempts = attempts + 1;
      await adminClient
        .from("otp_codes")
        .update({ failed_attempts: newAttempts })
        .eq("otp_id", otp_id);
      const remaining = MAX_ATTEMPTS - newAttempts;
      return respond(
        {
          error: remaining > 0
            ? `Incorrect OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
            : "Incorrect OTP. No attempts remaining. Please request a new OTP.",
        },
        400,
      );
    }

    // Mark OTP used immediately to prevent replay
    await adminClient.from("otp_codes").update({ used: true }).eq("otp_id", otp_id);

    // 3. Find or create user in public.users
    const { data: existingUser } = await adminClient
      .from("users")
      .select("id, onboarding_complete")
      .eq("phone", phone)
      .single();

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      if (!name || name.trim().length < 2) {
        return respond({ error: "Name is required for new accounts", is_new_user: true }, 422);
      }

      const { data: newUser, error: createError } = await adminClient
        .from("users")
        .insert({
          phone,
          name: name.trim(),
          date_of_birth: "1995-01-01",
          gender: "man",
          looking_for: "everyone",
          relationship_goal: "not_sure",
          phone_verified: true,
          trust_score: 10,
          onboarding_step: 1,
          onboarding_complete: false,
        })
        .select("id")
        .single();

      if (createError || !newUser) {
        console.error("User creation failed:", createError);
        return respond({ error: "Failed to create account" }, 500);
      }

      await adminClient.from("verifications").insert({
        user_id: newUser.id,
        verification_type: "phone",
        status: "approved",
        verified_at: new Date().toISOString(),
      });

      userId = newUser.id;
      isNewUser = true;
    }

    // Update last_active timestamp
    await adminClient
      .from("users")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", userId);

    // 4. Ensure Supabase Auth user exists with same UUID
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const internalEmail = `u${phone}@di.internal`;
    const internalPassword = await deriveInternalPassword(userId, serviceKey);

    const { data: existingAuth } = await adminClient.auth.admin.getUserById(userId);

    if (!existingAuth.user) {
      const { error: authCreateErr } = await adminClient.auth.admin.createUser({
        id: userId,
        email: internalEmail,
        password: internalPassword,
        email_confirm: true,
        user_metadata: { phone },
      });
      if (authCreateErr) {
        console.error("Auth user creation failed:", authCreateErr);
        return respond({ error: "Failed to create auth session" }, 500);
      }
    } else {
      await adminClient.auth.admin.updateUserById(userId, {
        email: internalEmail,
        password: internalPassword,
        email_confirm: true,
      });
    }

    // 5. Sign in to obtain a real Supabase session (ES256 JWT)
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: sessionData, error: signInErr } = await anonClient.auth.signInWithPassword({
      email: internalEmail,
      password: internalPassword,
    });

    if (signInErr || !sessionData.session) {
      console.error("Sign-in failed:", signInErr);
      return respond({ error: "Failed to create session. Please try again." }, 500);
    }

    const session = sessionData.session;
    return respond(
      {
        access_token: session.access_token,
        user_id: userId,
        is_new_user: isNewUser,
        expires_at: session.expires_at
          ? new Date(session.expires_at * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      200,
    );
  } catch (err) {
    console.error("verify-otp error:", err);
    return respond({ error: "Internal server error" }, 500);
  }
});
