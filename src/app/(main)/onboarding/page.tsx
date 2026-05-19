"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const STEPS = [
  {
    icon: "👋",
    title: "Welcome to SpotId",
    subtitle: "Before you dive in, here's what you need to know.",
    color: "from-indigo-500 to-purple-600",
    content: (
      <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
        <p>
          SpotId is built on one simple idea:{" "}
          <strong className="text-gray-900">you tag yourself, and the world finds you.</strong>
        </p>
        <p>
          Your profile has four parts:
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: "👤", label: "Permanent Profile", desc: "Always up — your photos, bio, and info" },
            { icon: "📅", label: "Daily Profile", desc: "Updated each day with hashtags about your day" },
            { icon: "👗", label: "Closet", desc: "Items you're selling, tagged and searchable" },
            { icon: "💼", label: "Work", desc: "Your services, discoverable by hashtag" },
          ].map((s) => (
            <div key={s.label} className="bg-indigo-50 rounded-xl p-3">
              <p className="text-xl mb-1">{s.icon}</p>
              <p className="font-semibold text-gray-900 text-xs">{s.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: "👁️",
    title: "What the World Can See",
    subtitle: "You are always in control of your visibility.",
    color: "from-amber-500 to-orange-500",
    content: (
      <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
        <div className="space-y-2">
          {[
            { label: "Your name, bio, photos, occupation, location field", visible: true, when: "Always (if you add them)" },
            { label: "Your Daily Profile hashtags", visible: true, when: "Only on the day you publish" },
            { label: "Your Closet listings", visible: true, when: "While marked active" },
            { label: "Your Work listings", visible: true, when: "While published" },
            { label: "Your email address", visible: false, when: "Never shown publicly" },
            { label: "Your date of birth", visible: false, when: "Never shown publicly" },
            { label: "Your password", visible: false, when: "Never stored or shown" },
          ].map((row) => (
            <div key={row.label} className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50">
              <span className={`text-sm flex-shrink-0 mt-0.5 ${row.visible ? "text-green-500" : "text-gray-300"}`}>
                {row.visible ? "👁️" : "🔒"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700">{row.label}</p>
                <p className="text-xs text-gray-400">{row.when}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs text-amber-800">
            <strong>Your Daily Profile resets every day.</strong> You choose whether to set it each morning.
            You can remove it instantly at any time with the &quot;Go Private&quot; button.
          </p>
        </div>
      </div>
    ),
  },
  {
    icon: "📋",
    title: "The Rules — Short Version",
    subtitle: "SpotId works because everyone respects these boundaries.",
    color: "from-red-500 to-pink-600",
    content: (
      <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
        <div className="space-y-2">
          {[
            { rule: "Finding someone on SpotId doesn't give you the right to approach them", ok: false },
            { rule: "Any in-person contact must be welcomed by the other person", ok: true },
            { rule: "Block and report anyone who makes you uncomfortable — instantly", ok: true },
            { rule: "Only post information about yourself — never others without consent", ok: true },
            { rule: "Stalking, harassment, or following someone will get you permanently banned and reported to law enforcement", ok: false },
            { rule: "SpotId is for adults 18+ only — no exceptions", ok: false },
            { rule: "You own your data and can delete everything at any time", ok: true },
          ].map((item) => (
            <div key={item.rule} className="flex items-start gap-3 p-2.5 rounded-lg bg-gray-50">
              <span className={`text-sm flex-shrink-0 mt-0.5 ${item.ok ? "text-green-500" : "text-red-500"}`}>
                {item.ok ? "✓" : "✕"}
              </span>
              <p className="text-xs text-gray-700 leading-relaxed">{item.rule}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 text-center">
          Full details in our{" "}
          <a href="/terms" target="_blank" className="text-indigo-600 hover:underline">Terms of Service</a>
          {" and "}
          <a href="/guidelines" target="_blank" className="text-indigo-600 hover:underline">Community Guidelines</a>.
        </p>
      </div>
    ),
  },
];

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [completing, setCompleting] = useState(false);

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const userId = (session?.user as { id?: string })?.id;
  const alreadyComplete = (session?.user as { onboardingComplete?: boolean })?.onboardingComplete;

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/signin"); return; }
    if (alreadyComplete && userId) router.replace(`/profile/${userId}`);
  }, [status, alreadyComplete, userId, router]);

  async function finish() {
    setCompleting(true);
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboardingComplete: true }),
    });
    router.push(userId ? `/profile/${userId}` : "/");
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">

      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-8">
        {STEPS.map((_, i) => (
          <div key={i} className={`rounded-full transition-all ${
            i === step ? "w-8 h-2.5 bg-indigo-600" : i < step ? "w-2.5 h-2.5 bg-indigo-300" : "w-2.5 h-2.5 bg-gray-200"
          }`} />
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${current.color} px-8 py-8 text-center`}>
          <p className="text-5xl mb-3">{current.icon}</p>
          <h1 className="text-2xl font-black text-white">{current.title}</h1>
          <p className="text-white/80 text-sm mt-1">{current.subtitle}</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {current.content}
        </div>

        {/* Navigation */}
        <div className="px-6 pb-6 flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)}
              className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition font-semibold text-sm">
              Back
            </button>
          )}
          <button
            onClick={isLast ? finish : () => setStep(step + 1)}
            disabled={completing}
            className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition text-sm"
          >
            {completing ? "Setting up your profile…" : isLast ? "Got it — Take me to my profile" : "Next →"}
          </button>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-4">
        Step {step + 1} of {STEPS.length}
      </p>
    </div>
  );
}
