import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  from_name?: string;
}

const respond = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  try {
    const { to, subject, html, from_name = "DateInIndia" }: EmailPayload = await req.json();

    if (!to || !subject || !html) {
      return respond({ error: "to, subject, and html are required" }, 400);
    }

    const apiKey   = Deno.env.get("SENDGRID_API_KEY");
    const fromEmail = Deno.env.get("SENDGRID_FROM_EMAIL") ?? "noreply@dateindia.com";

    if (!apiKey) {
      // DEV MODE: log to console, return success
      console.log("[send-email dev mode]", { to, subject });
      return respond({ success: true, dev_mode: true }, 200);
    }

    const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: from_name },
        subject,
        content: [{ type: "text/html", value: html }],
        reply_to: { email: fromEmail },
      }),
    });

    if (!sgRes.ok) {
      const errBody = await sgRes.text();
      console.error("SendGrid error:", sgRes.status, errBody);
      return respond({ error: "Failed to send email" }, 500);
    }

    return respond({ success: true }, 200);
  } catch (err) {
    console.error("send-email error:", err);
    return respond({ error: "Internal server error" }, 500);
  }
});
