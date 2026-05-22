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

export function premiumWelcomeEmail(name: string, profileUrl: string, settingsUrl: string): EmailTemplate {
  return {
    subject: "You're now SpotId Premium ✅",
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">SpotId Premium ✅</h2>
        <p>Hi${name ? ` ${name}` : ""},</p>
        <p>Your Premium subscription is now active. Here's what you've unlocked:</p>
        <ul style="color:#374151;line-height:1.8;padding-left:20px">
          <li><strong>👁️ See who viewed your profile</strong> — full visitor list, last 30 days</li>
          <li><strong>📊 90-day analytics</strong> — track your growth over time</li>
          <li><strong>⭐ Priority in Search & Discover</strong> — float to the top when active</li>
          <li><strong>✅ Verified badge</strong> — show you're a real committed member</li>
          <li><strong>🕶️ Browse anonymously</strong> — view profiles without appearing in their viewer list</li>
          <li><strong>📸 Unlimited photo album</strong> — upload as many photos as you want</li>
        </ul>
        <p style="margin:28px 0">
          <a href="${profileUrl}" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
            View My Profile
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px">
          You can manage your subscription (including cancellation) at any time from
          <a href="${settingsUrl}" style="color:#4f46e5">Settings → Subscription</a>.
          You keep premium access until the end of your billing period.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px">SpotId · Tag yourself. Get spotted.</p>
      </div>
    `,
    text: `You're now SpotId Premium!\n\nYou've unlocked: see who viewed your profile, 90-day analytics, priority placement, verified badge, anonymous browsing, and unlimited photos.\n\nView your profile: ${profileUrl}\n\nManage subscription: ${settingsUrl}`,
  };
}

export function premiumStatsEmail(
  name: string,
  stats: { viewsThisWeek: number; viewsAllTime: number; streak: number; totalDays: number },
  topViewers: { name: string; profileUrl: string }[],
  profileUrl: string,
  settingsUrl: string,
): EmailTemplate {
  const subject = stats.viewsThisWeek > 0
    ? `📊 Your SpotId stats: ${stats.viewsThisWeek} views this week`
    : `📊 Your SpotId weekly stats`;

  const viewerRows = topViewers.length > 0
    ? topViewers.map((v) => `<li><a href="${v.profileUrl}" style="color:#4f46e5;text-decoration:none">${v.name}</a></li>`).join("")
    : "<li>No signed-in views this week</li>";

  return {
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <h2 style="color:#4f46e5">SpotId Premium · Weekly Stats ✅</h2>
        <p>Hi ${name || "there"},</p>
        <p>Here's how your profile did this week:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr>
            <td style="padding:12px;background:#f9fafb;border-radius:8px;text-align:center">
              <p style="font-size:28px;font-weight:900;color:#4f46e5;margin:0">${stats.viewsThisWeek}</p>
              <p style="font-size:12px;color:#6b7280;margin:4px 0 0">views this week</p>
            </td>
            <td style="width:12px"></td>
            <td style="padding:12px;background:#f9fafb;border-radius:8px;text-align:center">
              <p style="font-size:28px;font-weight:900;color:#f97316;margin:0">🔥 ${stats.streak}</p>
              <p style="font-size:12px;color:#6b7280;margin:4px 0 0">day streak</p>
            </td>
            <td style="width:12px"></td>
            <td style="padding:12px;background:#f9fafb;border-radius:8px;text-align:center">
              <p style="font-size:28px;font-weight:900;color:#374151;margin:0">${stats.viewsAllTime.toLocaleString()}</p>
              <p style="font-size:12px;color:#6b7280;margin:4px 0 0">total views</p>
            </td>
          </tr>
        </table>
        ${topViewers.length > 0 ? `
        <div style="margin:20px 0">
          <p style="font-weight:700;color:#374151;margin-bottom:8px">Recent visitors (Premium exclusive):</p>
          <ul style="margin:0;padding-left:20px;color:#374151;line-height:1.8">
            ${viewerRows}
          </ul>
        </div>
        ` : ""}
        <p style="margin:24px 0">
          <a href="${profileUrl}" style="background:#4f46e5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
            View My Profile
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px">
          Tag daily to grow your reach. You can manage your subscription at
          <a href="${settingsUrl}" style="color:#4f46e5">Settings</a>.
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
        <p style="color:#9ca3af;font-size:12px">SpotId Premium · Tag yourself. Get spotted.</p>
      </div>
    `,
    text: `Your SpotId weekly stats:\n\n${stats.viewsThisWeek} views this week · 🔥 ${stats.streak} day streak · ${stats.viewsAllTime} total views\n\nView your profile: ${profileUrl}`,
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
