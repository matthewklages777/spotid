import Link from "next/link";

export const metadata = {
  title: "Community Guidelines — SpotId",
  description: "Read SpotId's community guidelines to understand how to participate respectfully and safely on the platform.",
};

export default function GuidelinesPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-7">
          <h1 className="text-2xl font-bold text-white">Community Guidelines</h1>
          <p className="text-indigo-200 text-sm mt-1">
            Plain English. What SpotId is for and how to be a good member of it.
          </p>
        </div>

        <div className="px-8 py-8 space-y-8 text-sm text-gray-600 leading-relaxed">

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
            <p className="font-bold text-indigo-900 mb-1">The one-sentence rule</p>
            <p className="text-indigo-800 text-base">
              SpotId is built on voluntary self-identification and mutual respect.
              Use it that way.
            </p>
          </div>

          <Section title="✅ What SpotId Is For">
            <ul className="space-y-3">
              {[
                { title: "Discovering people nearby", desc: "Finding someone who has tagged themselves at a place you're going, or happened to tag the same things as you." },
                { title: "Selling and finding items", desc: "Listing things you own with descriptive hashtags so the right buyer finds them — clothes, antiques, electronics, collectibles, anything." },
                { title: "Offering and finding services", desc: "Showcasing your professional skills so clients searching relevant hashtags discover you." },
                { title: "Real-world reconnection", desc: "Trying to find someone you saw or met, based on details you remember, in hopes they've tagged themselves with matching information." },
                { title: "General discovery", desc: "Searching for anything — a specific vintage item, a type of professional in a city, people with shared interests — and finding whoever has tagged it." },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                  <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                  <div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="🚫 What Will Get You Banned">
            <ul className="space-y-3">
              {[
                { title: "Stalking or physical surveillance", desc: "Using SpotId search results to follow, monitor, or repeatedly show up where another user has tagged themselves. This is a crime and will be reported to law enforcement." },
                { title: "Harassment of any kind", desc: "Sending unwanted messages, repeatedly contacting someone who has declined, threatening, intimidating, or demeaning other users — on or off the platform." },
                { title: "Non-consensual contact", desc: "Approaching someone in person based on their SpotId profile without clear indication they are open to meeting. Finding someone's location on SpotId does not grant permission to approach them." },
                { title: "Impersonation", desc: "Creating a profile pretending to be another person — real or fictional — is a violation of these guidelines and potentially the law." },
                { title: "Posting others without consent", desc: "Publishing photos, personal information, or details about another person without their explicit permission." },
                { title: "Underage use", desc: "SpotId is strictly 18+. Creating an account if you are under 18, or helping a minor create an account, results in immediate permanent bans for all involved accounts." },
                { title: "Fake or misleading profiles", desc: "Misrepresenting who you are, your location, your age, or what you're selling. If you list an item for sale, it must be real and accurately described." },
                { title: "Hate speech or discrimination", desc: "Content that attacks, demeans, or threatens any person or group based on race, ethnicity, religion, gender, sexual orientation, disability, or national origin." },
                { title: "Commercial spam", desc: "Using SpotId to mass-market products or services without genuine self-identification. Your tags must describe you or something you actually have." },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                  <span className="text-red-500 mt-0.5 flex-shrink-0">✕</span>
                  <div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="🛡️ Your Safety Tools">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: "🚫", title: "Block", desc: "Instantly prevents a user from finding you in search or viewing your profile. They are not notified." },
                { icon: "🚩", title: "Report", desc: "Flag a user for harassment, stalking, fake profiles, or any guideline violation. Every report is reviewed." },
                { icon: "👻", title: "Go Private", desc: "Remove your Daily Profile instantly. You disappear from all search results for today with one tap." },
              ].map((tool) => (
                <div key={tool.title} className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-3xl mb-2">{tool.icon}</p>
                  <p className="font-bold text-gray-900 text-sm">{tool.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{tool.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
              <p className="font-semibold text-red-900 mb-1">If you are in immediate danger</p>
              <p className="text-red-800 text-xs">
                Call 911 or your local emergency services immediately. Do not wait for SpotId to respond.
                SpotId will cooperate fully with law enforcement investigations involving our platform.
              </p>
            </div>
          </Section>

          <Section title="⚖️ Enforcement">
            <p>
              Violations of these guidelines result in consequences proportional to severity:
            </p>
            <div className="space-y-2 mt-3">
              {[
                { level: "Warning", color: "bg-yellow-50 border-yellow-200 text-yellow-800", desc: "Minor first violations — content removed, warning issued" },
                { level: "Temporary Suspension", color: "bg-orange-50 border-orange-200 text-orange-800", desc: "Repeated minor violations or a single serious violation" },
                { level: "Permanent Ban", color: "bg-red-50 border-red-200 text-red-800", desc: "Stalking, harassment, impersonation, underage use, or any threat of violence" },
                { level: "Law Enforcement Referral", color: "bg-red-100 border-red-300 text-red-900", desc: "Any credible threat of violence, stalking, or other criminal conduct" },
              ].map((e) => (
                <div key={e.level} className={`flex items-start gap-3 p-3 rounded-xl border ${e.color}`}>
                  <p className="font-bold text-xs flex-shrink-0 w-32">{e.level}</p>
                  <p className="text-xs">{e.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          <div className="border-t border-gray-100 pt-6 text-xs text-gray-400 text-center">
            <p>
              These guidelines exist to keep SpotId a place where people can share openly and safely.
              Thank you for being a respectful member of the community.
            </p>
            <p className="mt-3">
              <Link href="/terms" className="text-indigo-500 hover:underline">Terms of Service</Link>
              {" · "}
              <Link href="/privacy" className="text-indigo-500 hover:underline">Privacy Policy</Link>
              {" · "}
              <Link href="/" className="text-indigo-500 hover:underline">Back to SpotId</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
