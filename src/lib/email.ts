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

export function welcomeEmail(name: string, profileUrl: string, dailyUrl?: string, isFoundingMember?: boolean): EmailTemplate {
  const tagTodayUrl = dailyUrl || profileUrl.replace(/\/profile\/.*/, "/daily");
  return {
    subject: "You're in — tag your first day on SpotId 🏷️",
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:0">
        <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 24px;text-align:center">
          <p style="color:white;font-size:22px;font-weight:900;margin:0">SpotId</p>
          <p style="color:#c7d2fe;font-size:13px;margin:6px 0 0">Tag yourself. Get spotted.</p>
        </div>
        <div style="padding:32px 24px;background:#fff">
          ${isFoundingMember ? `
          <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:12px 16px;margin-bottom:24px;display:flex;align-items:center;gap:10px">
            <span style="font-size:20px">🌟</span>
            <div>
              <p style="margin:0;font-weight:700;color:#78350f;font-size:14px">You're a Founding Member!</p>
              <p style="margin:4px 0 0;color:#92400e;font-size:12px">You joined in the first 500 — your profile carries the 🌟 Founding Member badge forever.</p>
            </div>
          </div>` : ""}
          <h1 style="color:#111827;font-size:20px;font-weight:800;margin:0 0 12px">Welcome, ${name}! 👋</h1>
          <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 20px">
            You're on <strong>SpotId</strong> — the place where you tag yourself with hashtags and let the world find you.
            Your next step is to <strong>tag today</strong> so people searching your hashtags can find you right now.
          </p>
          <p style="margin:28px 0;text-align:center">
            <a href="${tagTodayUrl}" style="background:#4f46e5;color:white;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:800;font-size:15px;display:inline-block">
              Tag Today →
            </a>
          </p>
          <div style="border-top:1px solid #f3f4f6;padding-top:20px">
            <p style="color:#6b7280;font-size:13px;margin:0 0 10px;font-weight:600">Also worth doing:</p>
            <table style="width:100%;border-collapse:collapse">
              ${[
                ["👤", "Complete your profile", "Add a photo, bio, and occupation so people know who you are."],
                ["🛍️", "Add to your Closet", "List items for sale — buyers find you by hashtag, not algorithm."],
                ["💼", "List your Work", "Offer services and let clients search for you by skill."],
              ].map(([icon, title, desc]) => `
              <tr>
                <td style="padding:8px 0;vertical-align:top;width:28px;font-size:18px">${icon}</td>
                <td style="padding:8px 12px;vertical-align:top">
                  <p style="margin:0;font-weight:700;color:#111827;font-size:13px">${title}</p>
                  <p style="margin:3px 0 0;color:#6b7280;font-size:12px">${desc}</p>
                </td>
              </tr>`).join("")}
            </table>
          </div>
          <div style="margin-top:24px;text-align:center">
            <a href="${profileUrl}" style="color:#4f46e5;font-size:13px;text-decoration:none">View my profile →</a>
          </div>
        </div>
        <div style="background:#f9fafb;padding:16px 24px;text-align:center;border-top:1px solid #f3f4f6">
          <p style="color:#9ca3af;font-size:11px;margin:0">SpotId · Tag yourself. Get spotted.</p>
          <p style="color:#d1d5db;font-size:10px;margin:4px 0 0">Only tag information you're comfortable sharing publicly. You can go private at any time.</p>
        </div>
      </div>
    `,
    text: `Welcome to SpotId, ${name}!\n\n${isFoundingMember ? "🌟 You're a Founding Member — you joined in the first 500!\n\n" : ""}Tag your first day now:\n${tagTodayUrl}\n\nWhat to do next:\n1. Tag Today — go live right now\n2. Complete your profile — add a photo, bio, and occupation\n3. Add to your Closet — list items for sale\n4. List your Work — offer services by hashtag\n\nView your profile: ${profileUrl}\n\nSpotId — Tag yourself. Get spotted.`,
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

export function streakReminderEmail(name: string, streak: number, dailyUrl: string, settingsUrl: string): EmailTemplate {
  const streakText = streak > 1 ? `Your ${streak}-day streak is at risk!` : "Don't break your streak!";
  const fire = streak >= 7 ? "🔥🔥🔥" : streak >= 3 ? "🔥🔥" : "🔥";
  return {
    subject: `${fire} Tag today to keep your SpotId streak going`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:24px">
        <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:20px 24px;border-radius:12px 12px 0 0">
          <span style="color:white;font-size:20px;font-weight:900">SpotId</span>
        </div>
        <div style="background:white;padding:28px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
          <p style="font-size:40px;margin:0 0 12px 0;text-align:center">${fire}</p>
          <h2 style="color:#111827;margin:0 0 12px 0;text-align:center">${streakText}</h2>
          <p style="color:#6b7280;margin:0 0 20px 0;text-align:center">
            Hi ${name}, you haven't tagged today yet. Take 30 seconds to check in and stay discoverable.
          </p>
          <div style="text-align:center;margin:24px 0">
            <a href="${dailyUrl}" style="background:#4f46e5;color:white;padding:14px 32px;border-radius:100px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block">
              Tag Today →
            </a>
          </div>
          <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0">
            <a href="${settingsUrl}" style="color:#9ca3af">Unsubscribe from streak reminders</a>
          </p>
        </div>
      </div>
    `,
    text: `${streakText}\n\nHi ${name}, you haven't tagged today yet. Tag now to stay discoverable:\n${dailyUrl}\n\nManage notifications: ${settingsUrl}`,
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
