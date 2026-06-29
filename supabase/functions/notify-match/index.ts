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

function matchEmail(recipientName: string, matchName: string, appUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>You have a new match!</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:32px;text-align:center;">
              <p style="margin:0;font-size:36px;">💛</p>
              <h1 style="margin:12px 0 0;color:#fff;font-size:24px;font-weight:700;">It's a Match!</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;color:#374151;">Hi <strong>${recipientName}</strong>,</p>
              <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6;">
                You and <strong>${matchName}</strong> have liked each other on DateInIndia — it's a match!
                Break the ice and start a conversation now.
              </p>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/messages"
                       style="display:inline-block;padding:14px 32px;background:#f97316;color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;">
                      Start Chatting
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                You're receiving this because you have email notifications enabled.<br>
                <a href="${appUrl}/settings" style="color:#f97316;text-decoration:none;">Manage preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function welcomeEmail(name: string, appUrl: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welcome to DateInIndia</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:32px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;">Welcome to DateInIndia</h1>
              <p style="margin:8px 0 0;color:#fed7aa;font-size:15px;">India's most verified dating platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;color:#374151;">Hi <strong>${name}</strong>,</p>
              <p style="margin:0 0 24px;font-size:16px;color:#374151;line-height:1.6;">
                Your account is ready! Here's how to get started:
              </p>
              <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
                    <span style="color:#f97316;font-weight:700;">1.</span>
                    <span style="color:#374151;font-size:15px;margin-left:8px;">Complete your profile</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
                    <span style="color:#f97316;font-weight:700;">2.</span>
                    <span style="color:#374151;font-size:15px;margin-left:8px;">Verify your Aadhaar for the blue badge (+30 trust)</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 0;">
                    <span style="color:#f97316;font-weight:700;">3.</span>
                    <span style="color:#374151;font-size:15px;margin-left:8px;">Browse verified members and start matching</span>
                  </td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/browse"
                       style="display:inline-block;padding:14px 32px;background:#f97316;color:#fff;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;">
                      Start Browsing
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Questions? Reply to this email or contact
                <a href="mailto:support@dateindia.com" style="color:#f97316;text-decoration:none;">support@dateindia.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

async function sendEmail(to: string, subject: string, html: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  await fetch(`${supabaseUrl}/functions/v1/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ to, subject, html }),
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  try {
    const { type, user_id, other_user_id } = await req.json();
    const appUrl = Deno.env.get("APP_URL") ?? "https://dateindia.com";

    if (type === "match") {
      if (!user_id || !other_user_id) {
        return respond({ error: "user_id and other_user_id are required for match notifications" }, 400);
      }

      const { data: users } = await adminClient
        .from("users")
        .select("id, name, email")
        .in("id", [user_id, other_user_id]);

      if (!users || users.length < 2) {
        return respond({ error: "Could not find users" }, 404);
      }

      const u1 = users.find((u: { id: string }) => u.id === user_id);
      const u2 = users.find((u: { id: string }) => u.id === other_user_id);

      const sends: Promise<void>[] = [];
      if (u1?.email) {
        sends.push(sendEmail(
          u1.email,
          `You matched with ${u2?.name ?? "someone"}!`,
          matchEmail(u1.name, u2?.name ?? "someone", appUrl),
        ));
      }
      if (u2?.email) {
        sends.push(sendEmail(
          u2.email,
          `You matched with ${u1?.name ?? "someone"}!`,
          matchEmail(u2.name, u1?.name ?? "someone", appUrl),
        ));
      }
      await Promise.all(sends);
      return respond({ success: true, emails_sent: sends.length }, 200);
    }

    if (type === "welcome") {
      if (!user_id) return respond({ error: "user_id is required" }, 400);

      const { data: user } = await adminClient
        .from("users")
        .select("name, email")
        .eq("id", user_id)
        .single();

      if (!user?.email) {
        return respond({ success: true, skipped: true, reason: "no email on file" }, 200);
      }

      await sendEmail(
        user.email,
        "Welcome to DateInIndia!",
        welcomeEmail(user.name, appUrl),
      );
      return respond({ success: true }, 200);
    }

    return respond({ error: "Unknown type. Use 'match' or 'welcome'" }, 400);
  } catch (err) {
    console.error("notify-match error:", err);
    return respond({ error: "Internal server error" }, 500);
  }
});
