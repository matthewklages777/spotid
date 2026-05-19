import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — SpotId",
  description: "Learn how SpotId collects, uses, and protects your personal information.",
};

const EFFECTIVE_DATE = "May 12, 2026";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-8 py-7">
          <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
          <p className="text-gray-400 text-sm mt-1">Effective {EFFECTIVE_DATE}</p>
        </div>

        <div className="px-8 py-8 space-y-8 text-sm text-gray-600 leading-relaxed">

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <p className="font-bold text-blue-900 mb-1">The short version</p>
            <p className="text-blue-800">
              SpotId only knows what you tell it. We do not track your location, monitor your movements,
              or sell your data. Everything on your profile is there because you chose to put it there.
              You can remove it at any time.
            </p>
          </div>

          <Section title="1. What Information We Collect">
            <SubSection heading="Information you give us directly">
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Account info:</strong> Name, email address, and password (stored encrypted)</li>
                <li><strong>Profile info:</strong> Bio, occupation, location, phone, website — only if you add them</li>
                <li><strong>Photos:</strong> Images you upload to your profile or listings</li>
                <li><strong>Daily tags:</strong> Hashtags you choose to publish each day</li>
                <li><strong>Closet listings:</strong> Items you list for sale with their descriptions and tags</li>
                <li><strong>Work listings:</strong> Services you offer with their descriptions and tags</li>
              </ul>
            </SubSection>
            <SubSection heading="Information we do NOT collect">
              <ul className="list-none space-y-1 ml-2">
                {[
                  "Your GPS location or device location — ever",
                  "Your browsing history outside of SpotId",
                  "Your contacts, address book, or social graph",
                  "Device identifiers beyond what is necessary for session management",
                  "Any biometric data",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-green-500 flex-shrink-0">✓</span>
                    <span>We do <strong>not</strong> collect {item}</span>
                  </li>
                ))}
              </ul>
            </SubSection>
            <SubSection heading="Technical information">
              <p>
                Like all web services, we receive standard server logs including your IP address,
                browser type, and pages visited. This is used solely for security, debugging, and
                abuse prevention — never for advertising or profiling.
              </p>
            </SubSection>
          </Section>

          <Section title="2. Location — A Critical Distinction">
            <p>
              <strong className="text-gray-900">SpotId does not track your physical location.</strong>{" "}
              Any location information on your profile — a city, a venue, a neighborhood — is text
              that you typed yourself. We have no GPS, no geofencing, and no automatic location
              detection of any kind.
            </p>
            <p>
              This is intentional and fundamental to the platform. You choose what location to share,
              when to share it, and when to remove it. If you tag yourself at Starbucks in Plano,
              it&apos;s because you typed those words. When you want to stop being findable there,
              you remove the tag or let your Daily Profile expire.
            </p>
          </Section>

          <Section title="3. How Your Information Is Used">
            <p>We use the information you provide to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li>Display your profile to other users</li>
              <li>Make your tags searchable within SpotId</li>
              <li>Send you account-related notifications (password resets, etc.)</li>
              <li>Enforce our Terms of Service and protect user safety</li>
              <li>Improve the platform</li>
            </ul>
            <p className="mt-3">
              <strong className="text-gray-900">We do not sell your personal information to anyone. Ever.</strong>{" "}
              We do not use your data for advertising, and we do not share it with third parties
              except as described in Section 5.
            </p>
          </Section>

          <Section title="4. What Is Publicly Visible">
            <p>
              The following parts of your profile are <strong className="text-gray-900">visible to all SpotId users</strong>{" "}
              when you publish them:
            </p>
            <div className="mt-3 rounded-xl border border-gray-200 overflow-hidden">
              {[
                { item: "Your name", when: "Always (if set)" },
                { item: "Your bio, occupation, location field", when: "Always (if set)" },
                { item: "Your profile photos", when: "Always (if uploaded)" },
                { item: "Your Daily Profile hashtags and note", when: "Only on the day you publish them" },
                { item: "Your Closet listings", when: "While marked active (not sold)" },
                { item: "Your Work listings", when: "Always (while published)" },
              ].map((row) => (
                <div key={row.item} className="flex items-start gap-4 px-4 py-2.5 border-b border-gray-100 last:border-0 text-xs">
                  <span className="font-medium text-gray-700 flex-1">{row.item}</span>
                  <span className="text-gray-500 text-right">{row.when}</span>
                </div>
              ))}
            </div>
            <p className="mt-3">
              Your email address and password are <strong className="text-gray-900">never</strong> visible
              to other users or shown publicly.
            </p>
          </Section>

          <Section title="5. When We Share Information">
            <p>We share your information only in these limited circumstances:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li><strong>With your consent:</strong> When you publish it on your profile</li>
              <li><strong>Legal requirements:</strong> If required by a valid court order, subpoena, or law enforcement request</li>
              <li><strong>Safety:</strong> To prevent imminent harm to you or others, or to investigate serious violations of our Terms</li>
              <li><strong>Service providers:</strong> Third-party services strictly necessary to operate SpotId (e.g., hosting), under confidentiality agreements</li>
            </ul>
          </Section>

          <Section title="6. Data Retention and Deletion">
            <p>
              You may delete your account at any time. Upon deletion:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li>Your profile, photos, and listings are removed from public view immediately</li>
              <li>Your data is permanently deleted from our systems within 30 days</li>
              <li>Daily Profile data expires naturally at midnight each day regardless</li>
              <li>Server logs are retained for up to 90 days for security purposes</li>
            </ul>
          </Section>

          <Section title="7. Security">
            <p>
              We take security seriously. Passwords are hashed using industry-standard bcrypt encryption
              and are never stored in plain text. Access to user data is restricted to authorized
              personnel only. We use HTTPS encryption for all data in transit.
            </p>
            <p>
              No system is perfectly secure. If you discover a security vulnerability, please report
              it to us responsibly before disclosing it publicly.
            </p>
          </Section>

          <Section title="8. Your Rights (CCPA / GDPR)">
            <p>Depending on where you live, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li>Access the personal information we hold about you</li>
              <li>Correct inaccurate information</li>
              <li>Delete your information (right to be forgotten)</li>
              <li>Object to or restrict certain processing</li>
              <li>Data portability — receive your data in a machine-readable format</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us. We will respond within 30 days.
            </p>
          </Section>

          <Section title="9. Children's Privacy">
            <p>
              SpotId is not intended for anyone under 18 years of age. We do not knowingly collect,
              maintain, or use personal information from children under 18. If we learn that we have
              inadvertently collected information from a minor, we will delete it immediately.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify active users of
              material changes. Continued use of SpotId after changes take effect constitutes
              acceptance of the revised policy.
            </p>
          </Section>

          <div className="border-t border-gray-100 pt-6 text-xs text-gray-400 text-center">
            <p>
              <Link href="/terms" className="text-indigo-500 hover:underline">Terms of Service</Link>
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

function SubSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-800">{heading}</h3>
      {children}
    </div>
  );
}
