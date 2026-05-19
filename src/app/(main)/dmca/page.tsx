import Link from "next/link";

export const metadata = {
  title: "DMCA & Content Takedown — SpotId",
  description: "Submit a DMCA takedown request or learn how SpotId handles copyright infringement reports.",
};

export default function DmcaPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-8 py-7">
          <h1 className="text-2xl font-bold text-white">DMCA & Content Takedown Policy</h1>
          <p className="text-gray-400 text-sm mt-1">
            Digital Millennium Copyright Act compliance and content removal procedures
          </p>
        </div>

        <div className="px-8 py-8 space-y-8 text-sm text-gray-600 leading-relaxed">

          <Section title="Copyright Infringement — DMCA Notice">
            <p>
              SpotId respects the intellectual property rights of others and expects users to do the same.
              In accordance with the Digital Millennium Copyright Act of 1998 (17 U.S.C. § 512),
              SpotId will respond to valid notices of claimed copyright infringement.
            </p>
            <p>
              If you believe content on SpotId infringes your copyright, please submit a written
              notice containing <strong className="text-gray-900">all of the following</strong>:
            </p>
            <ol className="list-decimal list-inside space-y-2 mt-2 ml-2">
              <li>Your full legal name and contact information (address, phone, email)</li>
              <li>A description of the copyrighted work you claim has been infringed</li>
              <li>The specific URL(s) on SpotId where the infringing content appears</li>
              <li>A statement that you have a good faith belief the use is not authorized by the copyright owner, its agent, or the law</li>
              <li>A statement that the information in your notice is accurate and, under penalty of perjury, that you are the copyright owner or authorized to act on the owner&apos;s behalf</li>
              <li>Your physical or electronic signature</li>
            </ol>
            <div className="bg-gray-50 rounded-xl p-4 mt-2">
              <p className="font-semibold text-gray-900 mb-1">Submit DMCA notices to:</p>
              <p className="text-gray-700">SpotId — DMCA Agent</p>
              {/* ⚠️ ATTORNEY FLAG: Insert registered DMCA agent contact info and register with Copyright Office before launch */}
              <p className="text-indigo-600 italic text-xs mt-2">
                [DMCA Agent contact information to be added prior to public launch — see attorney note below]
              </p>
            </div>
          </Section>

          <Section title="Counter-Notice Procedure">
            <p>
              If content you posted was removed due to a DMCA notice and you believe the removal
              was made in error or misidentification, you may submit a counter-notice containing:
            </p>
            <ol className="list-decimal list-inside space-y-2 mt-2 ml-2">
              <li>Your full name and contact information</li>
              <li>Identification of the content that was removed and its location before removal</li>
              <li>A statement under penalty of perjury that you have a good faith belief the content was removed by mistake or misidentification</li>
              <li>Your consent to the jurisdiction of the Federal District Court for your district</li>
              <li>Your physical or electronic signature</li>
            </ol>
            <p className="mt-2">
              Upon receipt of a valid counter-notice, SpotId will notify the original complainant
              and may restore the content within 10–14 business days unless the complainant files
              a court action.
            </p>
          </Section>

          <Section title="Non-Copyright Content Removal">
            <p>
              For content that does not involve copyright but violates our policies — including
              photos posted of you without your consent, impersonation, or content posted by
              a deceased person&apos;s account — use the Report button on the relevant profile
              or contact us directly.
            </p>
            <p>
              We will review all requests and respond within 5 business days.
            </p>
          </Section>

          <Section title="Repeat Infringer Policy">
            <p>
              In accordance with the DMCA, SpotId will terminate the accounts of users who are
              determined to be repeat infringers of copyright. We reserve the right to terminate
              any account at our sole discretion.
            </p>
          </Section>

          {/* Attorney flag box */}
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5">
            <p className="font-bold text-amber-900 mb-2">⚠️ Attorney Review Required Before Launch</p>
            <ul className="text-amber-800 text-xs space-y-1 list-disc list-inside">
              <li>Register a DMCA Agent with the U.S. Copyright Office (required for Section 512 safe harbor protection)</li>
              <li>Insert registered DMCA Agent name, address, and contact information above</li>
              <li>Confirm jurisdiction clause aligns with chosen governing state</li>
              <li>Review counter-notice timeline for compliance with 17 U.S.C. § 512(g)</li>
              <li>Confirm this policy is accessible from the site footer as required</li>
            </ul>
          </div>

          <div className="border-t border-gray-100 pt-6 text-xs text-gray-400 text-center">
            <Link href="/terms" className="text-indigo-500 hover:underline">Terms of Service</Link>
            {" · "}
            <Link href="/privacy" className="text-indigo-500 hover:underline">Privacy Policy</Link>
            {" · "}
            <Link href="/guidelines" className="text-indigo-500 hover:underline">Community Guidelines</Link>
            {" · "}
            <Link href="/" className="text-indigo-500 hover:underline">Back to SpotId</Link>
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
