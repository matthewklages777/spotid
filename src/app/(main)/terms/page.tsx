import Link from "next/link";

export const metadata = {
  title: "Terms of Service — SpotId",
  description: "Read SpotId's Terms of Service to understand your rights and responsibilities when using the platform.",
};

const TOS_VERSION = "1.0";
const EFFECTIVE_DATE = "May 12, 2026";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-8 py-7">
          <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
          <p className="text-gray-400 text-sm mt-1">Version {TOS_VERSION} · Effective {EFFECTIVE_DATE}</p>
        </div>

        <div className="px-8 py-8 prose prose-gray max-w-none space-y-8 text-sm text-gray-600 leading-relaxed">

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <p className="font-bold text-amber-900 mb-1">Please read this carefully before using SpotId.</p>
            <p className="text-amber-800">
              By creating an account or using SpotId, you agree to be bound by these Terms. If you do not agree,
              do not use this platform. These Terms include important limitations on liability and prohibited conduct.
            </p>
          </div>

          <Section title="1. Who We Are">
            <p>
              SpotId is a social discovery platform that allows users to voluntarily tag themselves, their items,
              and their services with hashtags, making them searchable by other users. SpotId does not track users,
              collect location data automatically, or publish any information that users have not themselves chosen to share.
            </p>
          </Section>

          <Section title="2. Eligibility — You Must Be 18 or Older">
            <p>
              <strong className="text-gray-900">SpotId is strictly for users who are 18 years of age or older.</strong> By
              creating an account, you represent and warrant that you are at least 18 years old. If we discover
              that a user is under 18, their account will be terminated immediately. We do not knowingly collect
              information from or about anyone under 18.
            </p>
            <p>
              If you are a parent or guardian and believe your minor child has created an account, contact us
              immediately so we can remove it.
            </p>
          </Section>

          <Section title="3. Voluntary Self-Identification — The Foundation of SpotId">
            <p>
              The core principle of SpotId is <strong className="text-gray-900">voluntary, opt-in self-identification</strong>.
              Everything on your profile — your name, bio, photos, daily hashtags, closet listings, and work
              listings — is information you have chosen to share. By publishing that information on SpotId,
              you consent to it being searchable and discoverable by other users of the platform.
            </p>
            <p>
              You are in full control of your visibility at all times. You may update, remove, or make
              private any information at any time. Your Daily Profile resets each day and you choose
              whether to set it.
            </p>
          </Section>

          <Section title="4. Prohibited Conduct">
            <p>By using SpotId, you agree that you will <strong className="text-gray-900">NOT</strong>:</p>
            <ul className="list-none space-y-2 mt-3">
              {[
                "Use SpotId to stalk, harass, intimidate, threaten, or harm any person",
                "Follow, surveil, or physically approach another user without their clear and ongoing consent",
                "Use search results to show up uninvited at a location where another user has tagged themselves",
                "Collect or compile personal information about users for any unauthorized purpose",
                "Create a profile with false or misleading information about yourself",
                "Impersonate another person, living or deceased",
                "Use SpotId for commercial solicitation without clear disclosure",
                "Attempt to reverse-engineer, scrape, or harvest user data from the platform",
                "Use SpotId to facilitate any illegal activity whatsoever",
                "Create multiple accounts to evade a ban or block",
                "Share another person's private information without their explicit consent",
                "Use SpotId if you are a registered sex offender",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4">
              Violation of these rules may result in immediate account termination, reporting to law
              enforcement, and/or civil legal action.
            </p>
          </Section>

          <AttorneyFlag items={[
            "Confirm Section 230 safe harbor language in §6 is sufficient given your specific platform design",
            "Confirm whether 'voluntary self-identification' doctrine is cited correctly for your jurisdiction",
            "Confirm governing law/forum selection clause (§11) matches your business entity's state of formation",
          ]} />

          <Section title="5. Finding People — Consent and Responsibility">
            <p>
              SpotId may be used to search for and discover other users based on their self-published hashtags.
              This is an intended use of the platform. However, you acknowledge and agree that:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li>Discovering a user on SpotId does not grant you any right to contact, approach, or interact with them</li>
              <li>Any in-person interaction you initiate based on SpotId information is entirely your own responsibility</li>
              <li>You must respect another person&apos;s right to decline contact at any time</li>
              <li>Unwanted contact, following, or approaching is harassment, regardless of how you found the person</li>
            </ul>
            <p className="mt-3">
              SpotId facilitates discovery. What happens in the real world as a result of that discovery
              is entirely between the individuals involved. SpotId bears no responsibility for any
              in-person meeting, interaction, outcome, or incident.
            </p>
          </Section>

          <AttorneyFlag items={[
            "Add explicit arbitration clause and class-action waiver if desired",
            "Consider adding a 'no guarantee of results' clause (no guarantee any search will find a specific person or item)",
          ]} />

          <Section title="6. Limitation of Liability">
            <p>
              <strong className="text-gray-900">TO THE MAXIMUM EXTENT PERMITTED BY LAW, TAG&apos;D AND ITS OWNERS,
              OPERATORS, EMPLOYEES, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</strong> arising from or related to your use of
              the platform, including but not limited to:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
              <li>Any in-person meeting, interaction, or incident resulting from a SpotId search</li>
              <li>Any harm caused by another user of the platform</li>
              <li>Any loss of privacy resulting from information you voluntarily published</li>
              <li>Any commercial transaction conducted between users</li>
              <li>Any reliance on information posted by other users</li>
            </ul>
            <p className="mt-3">
              SpotId is an interactive computer service and is entitled to the protections afforded by
              Section 230 of the Communications Decency Act (47 U.S.C. § 230) with respect to
              user-generated content.
            </p>
          </Section>

          <AttorneyFlag items={[
            "ALL-CAPS limitation of liability language is standard for enforceability — confirm it meets Texas requirements",
            "Consider adding a liability cap (e.g., capped at fees paid in last 12 months)",
            "Section 230 citation should be verified — confirm SpotId qualifies as an 'interactive computer service'",
          ]} />

          <Section title="7. Your Content — What You Own and What You Grant Us">
            <p>
              You retain ownership of all content you post on SpotId, including photos, descriptions,
              and hashtags. By posting content, you grant SpotId a non-exclusive, royalty-free,
              worldwide license to display, store, and transmit that content solely for the purpose
              of operating the platform.
            </p>
            <p>
              You represent that you have the right to post all content you submit — including photos
              of yourself and items you own. Do not post photos of other people without their consent.
            </p>
          </Section>

          <Section title="8. Reporting and Blocking">
            <p>
              SpotId provides tools to block users and report abusive behavior. We take all reports
              seriously. Accounts found to be in violation of these Terms will be suspended or
              permanently banned. Serious violations — including stalking, threats, or harassment —
              will be reported to the appropriate law enforcement authorities.
            </p>
            <p>
              If you feel you are in immediate danger, contact local law enforcement (911) immediately.
              Do not wait for SpotId to respond.
            </p>
          </Section>

          <Section title="9. Termination">
            <p>
              SpotId reserves the right to suspend or permanently terminate any account at any time,
              for any reason, with or without notice. You may delete your account at any time.
              Upon deletion, your public data will be removed from search within 24 hours.
            </p>
          </Section>

          <Section title="10. Changes to These Terms">
            <p>
              We may update these Terms from time to time. When we do, we will update the version
              number and effective date at the top of this page and notify active users. Continued
              use of SpotId after changes take effect constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <AttorneyFlag items={[
            "Content license grant ('non-exclusive, royalty-free, worldwide') should be reviewed for scope — confirm it covers all intended uses (CDN caching, thumbnails, search indexing)",
            "Add a clause addressing what happens to user content upon account termination",
          ]} />

          <Section title="11. Governing Law">
            <p>
              These Terms are governed by the laws of the State of Texas, without regard to conflict
              of law principles. Any disputes shall be resolved in the courts of Collin County, Texas.
            </p>
          </Section>

          {/* Master attorney flag summary */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5">
            <p className="font-bold text-amber-900 mb-2">⚠️ Attorney Review Required Before Public Launch</p>
            <p className="text-amber-800 text-xs mb-3">
              This Terms of Service was drafted to cover the core legal framework for SpotId but has not been reviewed by licensed counsel.
              The following items must be addressed before launch:
            </p>
            <ul className="text-amber-800 text-xs space-y-1 list-disc list-inside">
              <li>Arbitration clause and class-action waiver (highly recommended for consumer platforms)</li>
              <li>COPPA compliance confirmation (even with 18+ age gate, verify no inadvertent minor data collection)</li>
              <li>State-specific privacy law compliance beyond GDPR/CCPA (e.g., Virginia, Colorado, Connecticut)</li>
              <li>Sex offender prohibition clause — consult counsel on enforceability and screening obligations</li>
              <li>Confirm Section 230 safe harbor applies to the specific product features (daily profile, search, closet)</li>
              <li>Add a contact email / registered agent address before publishing</li>
              <li>Register DMCA agent with the U.S. Copyright Office (required for safe harbor — see DMCA page)</li>
            </ul>
          </div>

          <div className="border-t border-gray-100 pt-6 text-xs text-gray-400 text-center">
            <p>Questions? Contact us before using the platform if you have concerns about these Terms.</p>
            <p className="mt-2">
              <Link href="/privacy" className="text-indigo-500 hover:underline">Privacy Policy</Link>
              {" · "}
              <Link href="/guidelines" className="text-indigo-500 hover:underline">Community Guidelines</Link>
              {" · "}
              <Link href="/dmca" className="text-indigo-500 hover:underline">DMCA Policy</Link>
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

function AttorneyFlag({ items }: { items: string[] }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <p className="font-semibold text-amber-900 text-xs mb-2">⚠️ Attorney Review Needed</p>
      <ul className="text-amber-800 text-xs space-y-1 list-disc list-inside">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
