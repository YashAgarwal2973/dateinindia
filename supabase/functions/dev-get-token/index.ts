import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// DEV-ONLY: creates or retrieves a Supabase Auth session for a given user_id,
// returning a properly-signed JWT that works with RLS policies (auth.uid()).
// The auth user is linked to the same UUID as the public.users row so RLS works.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const respond = (b: unknown, s: number) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: cors });

  try {
    const { user_id } = await req.json();
    if (!user_id) return respond({ error: "user_id required" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Look up the user in public.users to get their phone
    const { data: publicUser, error: puErr } = await admin
      .from("users")
      .select("id, name, phone, email")
      .eq("id", user_id)
      .single();

    if (puErr || !publicUser) {
      return respond({ error: "User not found in public.users", detail: puErr?.message }, 404);
    }

    // Use a deterministic test email based on the user's phone
    const testEmail = `dev+${publicUser.phone.replace(/\+/g, "")}@dateindia.test`;
    const testPassword = `DevPass-${user_id.slice(0, 8)}!`;

    // Create or update the Supabase Auth user with the same UUID
    // (so auth.uid() == public.users.id in all RLS policies)
    let authUserId = user_id;
    const { data: existingAuth } = await admin.auth.admin.getUserById(user_id);

    if (!existingAuth.user) {
      // Create auth user with matching UUID
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        id: user_id,
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: { name: publicUser.name },
      });
      if (createErr || !created.user) {
        return respond({ error: "Failed to create auth user", detail: createErr?.message }, 500);
      }
      authUserId = created.user.id;
    } else {
      // Ensure password is set (update if needed)
      await admin.auth.admin.updateUserById(user_id, {
        password: testPassword,
        email: testEmail,
        email_confirm: true,
      });
    }

    // Sign in with email + password to get a real session JWT
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: session, error: signInErr } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInErr || !session.session) {
      return respond({ error: "Sign-in failed", detail: signInErr?.message }, 500);
    }

    return respond({
      access_token: session.session.access_token,
      user_id: authUserId,
      email: testEmail,
      expires_at: session.session.expires_at,
      instructions: [
        "Open browser DevTools → Console and run:",
        `localStorage.setItem('dateinindia_session', JSON.stringify({`,
        `  access_token: '<paste token here>',`,
        `  user_id: '${authUserId}',`,
        `  expires_at: new Date(Date.now() + 30*24*60*60*1000).toISOString()`,
        `}))`,
        "Then reload the page — you will be logged in as this user.",
      ],
    }, 200);
  } catch (err) {
    console.error(err);
    return respond({ error: String(err) }, 500);
  }
});
