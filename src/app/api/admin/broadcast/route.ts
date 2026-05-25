import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/isAdmin";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

// POST /api/admin/broadcast
// Sends a broadcast email to all (or a filtered subset of) users.
// Body: { subject, body, target: "all" | "premium" | "free" | "active7d", testEmail?: string }
// Requires admin authentication.
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { subject, body, target, testEmail } = await req.json().catch(() => ({}));

  if (!subject || !body) {
    return Response.json({ error: "subject and body are required" }, { status: 400 });
  }
  if (typeof subject !== "string" || subject.length > 200) {
    return Response.json({ error: "Invalid subject" }, { status: 400 });
  }
  if (typeof body !== "string" || body.length > 50000) {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  const base = process.env["NEXTAUTH_URL"] || "https://www.spotidapp.com";

  // Test mode: send only to testEmail
  if (testEmail) {
    await sendEmail({
      to: testEmail,
      subject: `[TEST] ${subject}`,
      html: buildHtml(subject, body, base),
      text: `${subject}\n\n${body}\n\n---\nSpotId · ${base}`,
    });
    return Response.json({ sent: 1, mode: "test", to: testEmail });
  }

  // Build recipient filter
  const seven = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const where =
    target === "premium"
      ? { isPremium: true, email: { not: "" } }
      : target === "free"
      ? { isPremium: false, email: { not: "" } }
      : target === "active7d"
      ? { email: { not: "" }, dailyProfiles: { some: { date: { gte: seven.toISOString().slice(0, 10) } } } }
      : { email: { not: "" } }; // "all"

  const recipients = await prisma.user.findMany({
    where,
    select: { name: true, email: true },
  });

  if (recipients.length === 0) {
    return Response.json({ sent: 0, reason: "No matching recipients" });
  }

  let sent = 0;
  let failed = 0;

  for (const r of recipients) {
    try {
      await sendEmail({
        to: r.email,
        subject,
        html: buildHtml(subject, body, base, r.name || undefined),
        text: `${subject}\n\n${body}\n\n---\nSpotId · ${base}\nUnsubscribe: ${base}/settings`,
      });
      sent++;
    } catch {
      failed++;
    }
    // Throttle: 5 emails/second to avoid hitting SMTP rate limits
    if (sent % 5 === 0) await new Promise((r) => setTimeout(r, 1000));
  }

  return Response.json({ sent, failed, total: recipients.length, target });
}

function buildHtml(subject: string, body: string, base: string, name?: string): string {
  const greeting = name ? `Hi ${name},` : "Hi there,";
  // Convert newlines to <br> and wrap in minimal HTML
  const htmlBody = body
    .split("\n\n")
    .map((para) => `<p style="margin:0 0 16px 0;color:#374151;line-height:1.6">${para.replace(/\n/g, "<br>")}</p>`)
    .join("");

  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:20px 24px;border-radius:12px 12px 0 0">
        <span style="color:white;font-size:20px;font-weight:900;letter-spacing:-0.5px">SpotId</span>
      </div>
      <div style="background:white;padding:28px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <p style="margin:0 0 16px 0;color:#374151;line-height:1.6">${greeting}</p>
        ${htmlBody}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="margin:0;color:#9ca3af;font-size:12px">
          SpotId · Tag yourself. Get spotted. ·
          <a href="${base}/settings" style="color:#9ca3af">Manage email preferences</a>
        </p>
      </div>
    </div>
  `;
}
