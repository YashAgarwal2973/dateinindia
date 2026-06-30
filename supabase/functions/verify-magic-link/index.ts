import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const respond = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function deriveInternalPassword(userId: string, serviceKey: string): Promise<string> {
  const raw = `${userId}:${serviceKey.slice(-20)}`;
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex.slice(0, 32) + "Aa1!";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  try {
    const { token } = await req.json();

    if (!token || typeof token !== "string") {
      return respond({ error: "token is required" }, 400);
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // 1. Look up token
    const { data: linkRecord, error: lookupError } = await adminClient
      .from("magic_links")
      .select("id, email, name, expires_at, used")
      .eq("token", token)
      .single();

    if (lookupError || !linkRecord) {
      return respond({ error: "Invalid or expired link. Please request a new one." }, 400);
    }

    if (linkRecord.used) {
      return respond({ error: "This link has already been used. Please request a new one." }, 400);
    }

    if (new Date(linkRecord.expires_at) < new Date()) {
      return respond({ error: "This link has expired. Please request a new one." }, 400);
    }

    // 2. Mark as used immediately to prevent replay
    await adminClient.from("magic_links").update({ used: true }).eq("id", linkRecord.id);

    const email = linkRecord.email as string;
    const name = (linkRecord.name as string | null) ?? email.split("@")[0];

    // 3. Find or create user in public.users
    const { data: existingUser } = await adminClient
      .from("users")
      .select("id, onboarding_complete")
      .eq("email", email)
      .single();

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser, error: createError } = await adminClient
        .from("users")
        .insert({
          email,
          phone: `em_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`,
          name: name.trim(),
          date_of_birth: "1995-01-01",
          gender: "man",
          looking_for: "everyone",
          relationship_goal: "not_sure",
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

      userId = newUser.id;
      isNewUser = true;
    }

    // Update last_active
    await adminClient
      .from("users")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", userId);

    // 4. Ensure Supabase Auth user exists
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const internalPassword = await deriveInternalPassword(userId, serviceKey);

    const { data: existingAuth } = await adminClient.auth.admin.getUserById(userId);

    // Track whether the user has previously set their own password via /set-password.
    // Stored in user_metadata.has_password; preserved across magic-link sign-ins because
    // updateUserById only resets the auth password field, not the metadata.
    const hasPassword = existingAuth.user?.user_metadata?.has_password === true;

    if (!existingAuth.user) {
      const { error: authCreateErr } = await adminClient.auth.admin.createUser({
        id: userId,
        email,
        password: internalPassword,
        email_confirm: true,
        user_metadata: { email },
      });
      if (authCreateErr) {
        console.error("Auth user creation failed:", authCreateErr);
        return respond({ error: "Failed to create auth session" }, 500);
      }
    } else {
      await adminClient.auth.admin.updateUserById(userId, {
        email,
        password: internalPassword,
        email_confirm: true,
      });
    }

    // 5. Sign in to obtain a real session JWT
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: sessionData, error: signInErr } = await anonClient.auth.signInWithPassword({
      email,
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
        has_password: hasPassword,
        expires_at: session.expires_at
          ? new Date(session.expires_at * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      200,
    );
  } catch (err) {
    console.error("verify-magic-link error:", err);
    return respond({ error: "Internal server error" }, 500);
  }
});
