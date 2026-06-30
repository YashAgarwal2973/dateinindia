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

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  try {
    const { email, name } = await req.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return respond({ error: "Valid email is required" }, 400);
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!.trim(),
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!.trim(),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const { error: insertError } = await adminClient.from("magic_links").insert({
      email: email.toLowerCase().trim(),
      name: name?.trim() ?? null,
      token,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error("Failed to store magic link:", insertError);
      return respond({ error: "Failed to generate magic link" }, 500);
    }

    const appBaseUrl = (Deno.env.get("APP_BASE_URL") ?? "https://dateindia.app").trim();
    const magicLinkUrl = `${appBaseUrl}/verify?token=${token}`;

    const apiKey = Deno.env.get("SENDGRID_API_KEY")?.trim();
    const fromEmail = (Deno.env.get("SENDGRID_FROM_EMAIL") || "noreply@dateindia.app").trim();

    if (!apiKey) {
      console.log("[send-magic-link dev mode] Would send to:", email, "URL:", magicLinkUrl);
      return respond({ success: true, dev_mode: true }, 200);
    }

    const firstName = name?.trim().split(" ")[0] ?? "there";
    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a;">
  <h2 style="margin-bottom:8px;">Your login link for DateInIndia</h2>
  <p style="color:#555;margin-bottom:24px;">Hi ${firstName}, click the button below to sign in. This link expires in 15 minutes.</p>
  <a href="${magicLinkUrl}"
     style="display:inline-block;background:#e11d48;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;">
    Sign in to DateInIndia
  </a>
  <p style="margin-top:24px;color:#888;font-size:13px;">
    Or copy this link into your browser:<br>
    <a href="${magicLinkUrl}" style="color:#e11d48;word-break:break-all;">${magicLinkUrl}</a>
  </p>
  <p style="margin-top:24px;color:#aaa;font-size:12px;">
    If you didn't request this, you can safely ignore this email.
  </p>
</body>
</html>`;

    console.log("[send-magic-link] FROM_EMAIL_DEBUG:", JSON.stringify(fromEmail));
    console.log("[send-magic-link] API_KEY_SET:", !!apiKey, "KEY_LENGTH:", apiKey?.length);
    console.log("[send-magic-link] Calling SendGrid API for:", email);
    const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: email.toLowerCase().trim() }] }],
        from: { email: fromEmail, name: "DateInIndia" },
        subject: "Your DateInIndia login link",
        content: [{ type: "text/html", value: html }],
        reply_to: { email: fromEmail },
      }),
    });
    console.log("[send-magic-link] SendGrid response status:", sgRes.status, sgRes.statusText);

    if (!sgRes.ok) {
      const errBody = await sgRes.text();
      console.error("SendGrid error:", sgRes.status, errBody);
      return respond({ error: `SendGrid ${sgRes.status}: ${errBody}` }, 500);
    }

    return respond({ success: true }, 200);
  } catch (err: unknown) {
    const error = err as Error;
    console.error("[send-magic-link] Unhandled exception:");
    console.error("  message:", error?.message);
    console.error("  stack:", error?.stack);
    console.error("  full error object:", err);
    return respond({ error: "Internal server error" }, 500);
  }
});
