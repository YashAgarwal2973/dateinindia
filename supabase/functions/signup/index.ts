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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  try {
    const { email, password, name } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@"))
      return respond({ error: "Valid email is required" }, 400);
    if (!password || typeof password !== "string" || password.length < 8)
      return respond({ error: "Password must be at least 8 characters" }, 400);
    if (!name || typeof name !== "string" || name.trim().length < 2)
      return respond({ error: "Name is required" }, 400);

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!.trim(),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!.trim(),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    // Check if a profile already exists for this email
    const { data: existingProfile } = await adminClient
      .from("users")
      .select("id")
      .eq("email", cleanEmail)
      .single();

    if (existingProfile) {
      return respond({ error: "An account with this email already exists. Please sign in instead." }, 409);
    }

    // Create auth user with the real password.
    // email_confirm: true skips the verification email entirely — no Supabase
    // dashboard setting change needed. has_password in user_metadata lets
    // verify-magic-link know the user has a real password set.
    const { data: authData, error: createErr } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { name: cleanName, has_password: true },
    });

    if (createErr || !authData.user) {
      console.error("[signup] Auth user creation failed:", createErr);
      if (createErr?.message?.toLowerCase().includes("already")) {
        return respond({ error: "An account with this email already exists. Please sign in instead." }, 409);
      }
      return respond({ error: "Failed to create account. Please try again." }, 500);
    }

    const userId = authData.user.id;

    // Create the public.users profile row using service role (bypasses RLS)
    const { error: profileErr } = await adminClient.from("users").insert({
      id: userId,
      email: cleanEmail,
      name: cleanName,
      // Unique placeholder for the NOT NULL phone column; real value collected in onboarding if needed
      phone: `em_${userId.replace(/-/g, "").slice(0, 12)}`,
      date_of_birth: "1990-01-01", // placeholder; user sets their real DOB in onboarding
      gender: "man",               // placeholder; user sets in onboarding
      looking_for: "everyone",
      relationship_goal: "not_sure",
      trust_score: 10,
      is_discoverable: true,
      // onboarding_step and onboarding_complete omitted — DB defaults (1, false) are correct
    });

    if (profileErr) {
      console.error("[signup] Profile creation failed:", profileErr);
      await adminClient.auth.admin.deleteUser(userId);
      return respond({ error: "Failed to set up profile. Please try again." }, 500);
    }

    // Sign in immediately to hand back a real session JWT
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!.trim(),
      Deno.env.get("SUPABASE_ANON_KEY")!.trim(),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: sessionData, error: signInErr } = await anonClient.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (signInErr || !sessionData.session) {
      console.error("[signup] Sign-in after signup failed:", signInErr);
      return respond({ error: "Account created but sign-in failed. Please go to the login page and sign in." }, 500);
    }

    const session = sessionData.session;
    return respond({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      user_id: userId,
      expires_at: session.expires_at
        ? new Date(session.expires_at * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }, 200);

  } catch (err: unknown) {
    const error = err as Error;
    console.error("[signup] Unhandled exception:", error?.message, error?.stack);
    return respond({ error: "Internal server error" }, 500);
  }
});
