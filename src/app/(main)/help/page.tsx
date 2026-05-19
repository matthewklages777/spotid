import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Help & FAQ — SpotId",
  description: "Frequently asked questions and help articles for SpotId.",
};

const faqs = [
  {
    section: "Getting Started",
    items: [
      {
        q: "What is SpotId?",
        a: "SpotId is a voluntary hashtag-based discovery platform. You tag yourself each day with hashtags that describe what you're doing, selling, or looking for — and others can find you by searching those tags.",
      },
      {
        q: "Who can use SpotId?",
        a: "SpotId is for users 18 and older only. By creating an account, you confirm that you meet this age requirement.",
      },
      {
        q: "Is SpotId free?",
        a: "Yes. SpotId is free to join, post, and search.",
      },
      {
        q: "How do I set my Daily Profile?",
        a: "Go to the Daily page from the navigation bar. Type in your hashtags for today — what you're up to, wearing, selling, or interested in — and click Publish. Your daily profile is visible to others for that calendar day.",
      },
    ],
  },
  {
    section: "Privacy & Safety",
    items: [
      {
        q: "What information is visible on my profile?",
        a: "Only information you choose to add: your name, bio, photo, occupation, location field, and Daily Profile hashtags. Your email address, password, and phone number are never shown publicly.",
      },
      {
        q: "How do I make myself harder to find?",
        a: "Simply don't post a Daily Profile. Without an active daily post, you won't appear in discover or hashtag feeds. You can also mark yourself as not open to contact in your profile settings.",
      },
      {
        q: "Can I block someone?",
        a: "Yes. On any profile, tap the ··· menu and choose Block. Blocked users won't see you in search or discover, and they can't message you. You can manage your block list in Settings.",
      },
      {
        q: "What if someone is harassing me?",
        a: "Use the 🚩 Report button on their profile immediately. You can also block them to prevent further contact. If you feel unsafe, contact local law enforcement — SpotId will cooperate with law enforcement requests.",
      },
      {
        q: "Does SpotId share my data with third parties?",
        a: "No. SpotId does not sell or share your personal data with advertisers or third parties. See our Privacy Policy for full details.",
      },
      {
        q: "How do I download all my data?",
        a: "Go to Settings → Privacy & Data and click \"Download My Data\". You'll receive a JSON file containing everything SpotId holds about your account.",
      },
      {
        q: "How do I delete my account?",
        a: "Go to Settings, scroll to the Danger Zone section, enter your password, type DELETE, and confirm. Your account and all associated data will be permanently removed.",
      },
    ],
  },
  {
    section: "Daily Profile",
    items: [
      {
        q: "How long does my Daily Profile stay visible?",
        a: "Your Daily Profile is visible for the calendar day you post it (midnight to midnight, server time). After that, it no longer appears in discover or hashtag searches — but it does remain in your profile history.",
      },
      {
        q: "Can I edit or remove my Daily Profile?",
        a: "Yes. Go to the Daily page and use the \"Go Private\" button to immediately remove your active daily post. You can re-publish at any time.",
      },
      {
        q: "What is a streak?",
        a: "A streak counts consecutive days on which you've posted a Daily Profile. Keep tagging every day to grow it! Your streak is displayed on your profile.",
      },
      {
        q: "How many hashtags can I use?",
        a: "You can use up to 20 hashtags per Daily Profile. Tags must be single words (no spaces) and can contain letters, numbers, and hyphens.",
      },
    ],
  },
  {
    section: "Closet & Work",
    items: [
      {
        q: "What's the difference between Closet and Work?",
        a: "Closet is for physical items you're selling (antiques, clothing, collectibles, etc.). Work is for services you offer (freelance, repairs, tutoring, etc.).",
      },
      {
        q: "Can I edit my listings after posting?",
        a: "Yes. Click on any of your listings to open the detail page, then use the Edit button (visible only to you as the owner).",
      },
      {
        q: "How do buyers contact me about a listing?",
        a: "They use the Message button on your profile or listing page. Make sure \"Open to Contact\" is enabled in your profile settings to receive messages.",
      },
      {
        q: "How do I mark an item as sold?",
        a: "Open the item's detail page and click \"Mark as Sold\". Sold items remain visible on your profile so others can see your track record, but they'll be marked sold.",
      },
    ],
  },
  {
    section: "Notifications & Messaging",
    items: [
      {
        q: "How do I control which email notifications I receive?",
        a: "Go to Settings → Email Notifications. You can independently toggle notifications for new messages, new followers, tag follows, and the weekly digest.",
      },
      {
        q: "Can I message someone who hasn't messaged me first?",
        a: "Yes, if their profile shows they are \"Open to Contact\". If a user has disabled this setting, they can't be messaged.",
      },
      {
        q: "How do I follow a hashtag?",
        a: "On any hashtag page (e.g., /tag/vintage), click the \"Follow\" button. You'll then see new posts with that tag in your feed and can manage followed tags from the Following Tags page.",
      },
    ],
  },
  {
    section: "Account & Technical",
    items: [
      {
        q: "I forgot my password. How do I reset it?",
        a: "On the sign-in page, click \"Forgot password?\" and enter your email. You'll receive a reset link if an account with that email exists.",
      },
      {
        q: "Can I change my username?",
        a: "Yes. Go to your profile and click Edit Profile. Your username must be unique across SpotId and only contain letters, numbers, underscores, and hyphens.",
      },
      {
        q: "Can I install SpotId as an app?",
        a: "Yes! SpotId is a Progressive Web App (PWA). On iOS, open SpotId in Safari and tap Share → Add to Home Screen. On Android, tap the browser menu and choose Install App.",
      },
      {
        q: "Something isn't working. Who do I contact?",
        a: "Use the Report button on any profile or post to flag content issues. For account or technical problems, email us through the contact information in the footer of your account page.",
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-10">

      {/* Header */}
      <div className="text-center space-y-3">
        <p className="text-5xl">❓</p>
        <h1 className="text-3xl font-black text-gray-900">Help &amp; FAQ</h1>
        <p className="text-gray-500 max-w-lg mx-auto">
          Answers to the most common questions about SpotId. Didn&apos;t find what you need?
          Use the Report button on any profile to contact our team.
        </p>
      </div>

      {/* Quick links */}
      <div className="flex flex-wrap justify-center gap-2">
        {faqs.map((s) => (
          <a
            key={s.section}
            href={`#${s.section.toLowerCase().replace(/[^a-z]/g, "-")}`}
            className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition font-medium"
          >
            {s.section}
          </a>
        ))}
      </div>

      {/* FAQ sections */}
      {faqs.map((section) => (
        <section
          key={section.section}
          id={section.section.toLowerCase().replace(/[^a-z]/g, "-")}
          className="scroll-mt-20"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            {section.section}
          </h2>
          <div className="space-y-4">
            {section.items.map((item) => (
              <div key={item.q} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <details className="group">
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none hover:bg-gray-50 transition">
                    <span className="font-semibold text-gray-900 text-sm leading-snug">{item.q}</span>
                    <span className="text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 text-lg leading-none">
                      ›
                    </span>
                  </summary>
                  <div className="px-5 pb-5 pt-0">
                    <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Still need help */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-8 text-center space-y-3">
        <p className="text-3xl">💬</p>
        <h3 className="font-bold text-gray-900">Still have questions?</h3>
        <p className="text-sm text-gray-600 max-w-sm mx-auto">
          Use the Report / Contact button on any profile, or reach out via the links in our legal pages.
        </p>
        <div className="flex gap-3 justify-center pt-1 flex-wrap">
          <Link href="/guidelines" className="text-sm text-indigo-600 hover:underline font-medium">Community Guidelines</Link>
          <span className="text-gray-300">·</span>
          <Link href="/terms" className="text-sm text-indigo-600 hover:underline font-medium">Terms of Service</Link>
          <span className="text-gray-300">·</span>
          <Link href="/privacy" className="text-sm text-indigo-600 hover:underline font-medium">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
