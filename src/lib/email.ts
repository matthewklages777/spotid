import nodemailer from "nodemailer";

function createTransport() {
  const host = process.env["SMTP_HOST"];
  const user = process.env["SMTP_USER"];
  const pass = process.env["SMTP_PASS"];

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env["SMTP_PORT"] || "587"),
    secure: process.env["SMTP_SECURE"] === "true",
    auth: { user, pass },
  });
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

type EmailTemplate = Omit<EmailOptions, "to">;

export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  const transport = createTransport();
  const from = process.env["EMAIL_FROM"] || "SpotId <noreply@spotid.app>";

  if (!transport) {
    // Dev fallback — log to console
    console.log("\n[SpotId Email — SMTP not configured]");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text || "(html only)");
    console.log();
    return true;
  }

  try {
    await transport.sendMail({ from, to, subject, html, text });
    return true;
  } catch (err) {
    console.error("[SpotId Email Error]", err);
    return false;
  }
}

// ── Email templates ──────────────────────────────────────────────

export function passwordResetEmail(resetUrl: string, name?: string): EmailTemplate {
  return {
    subject: "Reset your SpotId password",
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">SpotId</h2>
        <p>Hi${name ? ` ${name}` : ""},</p>
        <p>We received a request to reset your password. Click the button below to choose a new one. This link expires in <strong>1 hour</strong>.</p>
        <p style="margin:28px 0">
          <a href="${resetUrl}" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
            Reset My Password
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
        <p style="color:#6b7280;font-size:13px">Or copy this link: ${resetUrl}</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px">SpotId · Tag yourself. Get spotted.</p>
      </div>
    `,
    text: `Reset your SpotId password\n\n${name ? `Hi ${name},\n\n` : ""}Click this link to reset your password (expires in 1 hour):\n\n${resetUrl}\n\nIf you didn't request this, ignore this email.`,
  };
}

export function welcomeEmail(name: string, profileUrl: string): EmailTemplate {
  return {
    subject: "Your SpotId is ready 🏷️",
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">Welcome to SpotId, ${name}!</h2>
        <p>You&apos;re in. SpotId is the place where <strong>you tag yourself, and the world finds you.</strong></p>
        <p>Here's how to get started:</p>
        <ol style="color:#374151;line-height:1.8">
          <li><strong>Set your Daily Profile</strong> — tag where you are, what you're wearing, what you're doing today</li>
          <li><strong>Add to your Closet</strong> — list items you're selling with hashtags so buyers find you</li>
          <li><strong>List your Work</strong> — showcase your services and let clients search you out</li>
        </ol>
        <p style="margin:28px 0">
          <a href="${profileUrl}" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
            View My Profile
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px">
          Remember: SpotId is built on voluntary self-identification. Only tag information you're comfortable sharing publicly.
          You can go private at any time.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px">SpotId · Tag yourself. Get spotted.</p>
      </div>
    `,
    text: `Welcome to SpotId, ${name}!\n\nYou're in. Here's how to get started:\n1. Set your Daily Profile\n2. Add to your Closet\n3. List your Work\n\nView your profile: ${profileUrl}\n\nSpotId — Tag yourself. Get spotted.`,
  };
}

export function tagFollowEmail(taggerName: string, tagName: string, profileUrl: string, followedTagsUrl: string): EmailTemplate {
  return {
    subject: `${taggerName} tagged #${tagName} on SpotId`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">SpotId</h2>
        <p><strong>${taggerName}</strong> just tagged <strong>#${tagName}</strong> — a hashtag you follow.</p>
        <p style="margin:24px 0">
          <a href="${profileUrl}" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
            View Their Profile
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px">
          You're following <strong>#${tagName}</strong>.
          <a href="${followedTagsUrl}" style="color:#4f46e5">Manage your followed tags →</a>
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px">SpotId · Tag yourself. Get spotted.</p>
      </div>
    `,
    text: `${taggerName} tagged #${tagName} on SpotId — a hashtag you follow.\n\nView their profile: ${profileUrl}\n\nManage followed tags: ${followedTagsUrl}`,
  };
}

export function weeklyDigestEmail(
  name: string,
  items: { personName: string; profileUrl: string; tags: string[] }[],
  discoverUrl: string,
  settingsUrl: string,
): EmailTemplate {
  const rows = items.slice(0, 8).map((i) =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6">
        <a href="${i.profileUrl}" style="color:#4f46e5;font-weight:600;text-decoration:none">${i.personName}</a>
        <span style="color:#6b7280;font-size:12px;margin-left:8px">${i.tags.map((t) => `#${t}`).join(" ")}</span>
      </td>
    </tr>`
  ).join("");

  return {
    subject: `Your weekly SpotId digest — ${items.length} people were active`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">SpotId Weekly Digest</h2>
        <p>Hi ${name}, here's what people you follow have been up to this week:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          ${rows}
        </table>
        ${items.length > 8 ? `<p style="color:#6b7280;font-size:13px">…and ${items.length - 8} more.</p>` : ""}
        <p style="margin:24px 0">
          <a href="${discoverUrl}" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
            Open Discover
          </a>
        </p>
        <p style="color:#9ca3af;font-size:12px">
          You're receiving this because you follow people on SpotId.
          <a href="${settingsUrl}" style="color:#6b7280">Manage email preferences →</a>
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px">SpotId · Tag yourself. Get spotted.</p>
      </div>
    `,
    text: `SpotId Weekly Digest\n\nHi ${name},\n\nHere's what people you follow tagged this week:\n\n${items.slice(0, 8).map((i) => `• ${i.personName}: ${i.tags.map((t) => `#${t}`).join(" ")} — ${i.profileUrl}`).join("\n")}\n\nOpen Discover: ${discoverUrl}\n\nManage email preferences: ${settingsUrl}`,
  };
}

export function verificationEmail(name: string, verifyUrl: string): EmailTemplate {
  return {
    subject: "Verify your SpotId email address",
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">SpotId</h2>
        <p>Hi ${name},</p>
        <p>Thanks for joining SpotId! Please confirm your email address to complete your account setup.</p>
        <p style="margin:24px 0">
          <a href="${verifyUrl}" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
            Verify Email Address
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px">This link expires in 24 hours. If you didn't sign up for SpotId, you can safely ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px">SpotId · Tag yourself. Get spotted.</p>
      </div>
    `,
    text: `Hi ${name},\n\nVerify your SpotId email address by clicking this link:\n\n${verifyUrl}\n\nThis link expires in 24 hours.`,
  };
}

export function newFollowerEmail(followerName: string, followerProfileUrl: string, settingsUrl: string): EmailTemplate {
  return {
    subject: `${followerName} followed you on SpotId`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">SpotId</h2>
        <p><strong>${followerName}</strong> started following you on SpotId.</p>
        <p>They'll see your daily updates in their feed. Say hi!</p>
        <p style="margin:24px 0">
          <a href="${followerProfileUrl}" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
            View Their Profile
          </a>
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px">SpotId · <a href="${settingsUrl}" style="color:#9ca3af">Manage email preferences</a></p>
      </div>
    `,
    text: `${followerName} started following you on SpotId.\n\nView their profile: ${followerProfileUrl}\n\nManage email preferences: ${settingsUrl}`,
  };
}

export function newMessageEmail(senderName: string, preview: string, inboxUrl: string): EmailTemplate {
  return {
    subject: `New message from ${senderName} on SpotId`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">SpotId</h2>
        <p>You have a new message from <strong>${senderName}</strong>:</p>
        <div style="background:#f9fafb;border-left:4px solid #4f46e5;padding:12px 16px;border-radius:4px;margin:16px 0;color:#374151;font-style:italic">
          "${preview}"
        </div>
        <p style="margin:24px 0">
          <a href="${inboxUrl}" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
            View Message
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px">You can block this user from their profile if you don't want to receive messages from them.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px">SpotId · Tag yourself. Get spotted.</p>
      </div>
    `,
    text: `New message from ${senderName} on SpotId:\n\n"${preview}"\n\nView it here: ${inboxUrl}`,
  };
}
