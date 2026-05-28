import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Find People at Events & Concerts by Hashtag — SpotId",
  description:
    "Tag yourself at concerts, conferences, meetups, and festivals. Search the event hashtag and find others who are there. SpotId connects people at live events in real time.",
  keywords: ["find people at events", "concert hashtag", "event networking", "conference connections", "festival social", "meet people at same event"],
  openGraph: {
    title: "Find People at Events & Concerts by Hashtag — SpotId",
    description: "Tag yourself at any event. Others at the same event find you instantly. SpotId — real-time event networking by hashtag.",
    type: "website",
    siteName: "SpotId",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find People at Events by Hashtag — SpotId",
    description: "Tag yourself at concerts, conferences, and meetups. Find others there in real time.",
  },
  alternates: { canonical: "https://www.spotidapp.com/events" },
};

const EVENT_SCENARIOS = [
  {
    icon: "🎵",
    title: "Concerts & Music Festivals",
    tags: ["Coachella2025", "row14", "generalAdmission", "Taylor", "Eras", "lateNight"],
    desc: "You're at the show. Tag the event, your section, your vibe. Find the people around you who tagged the same things.",
  },
  {
    icon: "🏢",
    title: "Conferences & Networking",
    tags: ["SXSWTech", "openToConnect", "VC", "B2B", "saas", "Austin"],
    desc: "You're at a conference. Tag your industry, your company stage, what you're looking to discuss. The right conversation finds you.",
  },
  {
    icon: "🤝",
    title: "Meetups & Social Events",
    tags: ["DallasFounders", "openToConnect", "techMeetup", "Dallas", "tuesday"],
    desc: "You're at a local meetup. Tag it. Others at the same event see your profile and know you're there.",
  },
  {
    icon: "⚽",
    title: "Sports Events",
    tags: ["LakersCourt", "section108", "superfan", "Dallas", "Cowboys", "seasonTicket"],
    desc: "At the game and want to connect with other fans? Tag your section, the game, your team energy. Find your people.",
  },
];

export default function EventsPage() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-14">

      {/* Hero */}
      <div className="text-center space-y-5">
        <div className="inline-block bg-purple-100 text-purple-800 text-sm font-semibold px-4 py-1.5 rounded-full">
          For Events, Concerts &amp; Live Experiences
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight">
          You&apos;re at the event.<br />
          <span className="text-purple-600">Find others who are too.</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          SpotId turns events into instant, hashtag-powered connection rooms. Tag yourself at any
          concert, conference, meetup, or festival — anyone searching the same tags sees you there in real time.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/signup"
            className="bg-purple-600 text-white px-8 py-3 rounded-full font-bold text-base hover:bg-purple-700 transition shadow-sm"
          >
            Join Free — Tag Your Next Event
          </Link>
          <Link
            href="/search"
            className="bg-white text-gray-700 border-2 border-gray-200 px-8 py-3 rounded-full font-bold text-base hover:border-purple-400 transition"
          >
            Search an Event Now
          </Link>
        </div>
      </div>

      {/* How it works for events */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-8 space-y-5">
        <h2 className="text-2xl font-bold text-gray-900">How it works at an event</h2>
        <div className="space-y-4">
          {[
            {
              step: "1",
              icon: "📅",
              title: "Before or when you arrive",
              desc: "Open SpotId and set your Daily Profile. Add the event name, location, section/area, and any details about yourself that might help others find you.",
              example: ["Coachella2025", "weekend1", "row3", "openToConnect", "indie"],
            },
            {
              step: "2",
              icon: "🔍",
              title: "Others search and find you",
              desc: "Anyone searching the event hashtag sees a live list of people tagged with it. They can see who else is there, what section they're in, what they're into.",
              example: null,
            },
            {
              step: "3",
              icon: "💬",
              title: "Make contact directly",
              desc: "If someone finds you and you've turned on 'open to contact', they can message you through SpotId. You decide whether to respond.",
              example: null,
            },
          ].map((step) => (
            <div key={step.step} className="flex gap-4">
              <div className="w-8 h-8 bg-purple-100 text-purple-700 font-bold text-sm rounded-full flex items-center justify-center flex-shrink-0">
                {step.step}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span>{step.icon}</span>
                  <p className="font-bold text-gray-900 text-sm">{step.title}</p>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                {step.example && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {step.example.map((tag) => (
                      <span key={tag} className="bg-purple-600 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Event scenarios */}
      <div className="space-y-5">
        <h2 className="text-2xl font-bold text-gray-900">Works for every kind of event</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {EVENT_SCENARIOS.map((s) => (
            <div key={s.title} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{s.icon}</span>
                <h3 className="font-bold text-gray-900 text-sm">{s.title}</h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
              <Link href={`/search?q=${s.tags.map((t) => `%23${t}`).join("+")}`}>
                <div className="flex flex-wrap gap-1.5 mt-1 cursor-pointer hover:opacity-80 transition">
                  {s.tags.map((tag) => (
                    <span key={tag} className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Safety note */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
        <span className="text-2xl flex-shrink-0">🔒</span>
        <div>
          <h3 className="font-bold text-gray-900 mb-1">Your safety, your control</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            You only appear in event searches when you choose to tag yourself. You can remove your daily profile
            instantly at any time with a single tap. Finding you on SpotId gives no one the right to approach you —
            any contact must be welcomed by you. Block and report anyone who makes you uncomfortable.
          </p>
        </div>
      </div>

      {/* Tag tips for events */}
      <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm space-y-5">
        <h2 className="text-2xl font-bold text-gray-900">📝 What to tag at events</h2>
        <div className="space-y-4">
          {[
            {
              category: "The event itself",
              tags: ["Coachella2025", "SXSW", "CES2026", "TedxDallas", "RunDMT"],
            },
            {
              category: "Your location/area",
              tags: ["mainStage", "section108", "VIPLounge", "exhibitHall", "floorSection3"],
            },
            {
              category: "What you're looking for",
              tags: ["openToConnect", "lookingForCollabs", "networking", "investing", "hiring"],
            },
            {
              category: "Who you are",
              tags: ["founder", "photographer", "designer", "developer", "speaker", "attendee"],
            },
            {
              category: "The vibe",
              tags: ["solo", "friendsGroup", "firstTime", "superfan", "VIP", "volunteer"],
            },
          ].map((group) => (
            <div key={group.category}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{group.category}</p>
              <div className="flex flex-wrap gap-1.5">
                {group.tags.map((tag) => (
                  <Link key={tag} href={`/tag/${tag}`}
                    className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full hover:bg-purple-100 transition font-medium">
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-8 text-white text-center space-y-5">
        <h2 className="text-2xl font-black">Your next event is your next connection.</h2>
        <p className="text-purple-200 max-w-lg mx-auto text-sm leading-relaxed">
          Create your free SpotId profile. Before your next event, tag yourself. Let the people
          who should find you, find you.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link
            href="/signup"
            className="bg-white text-purple-700 font-bold px-8 py-3 rounded-full hover:bg-purple-50 transition text-sm shadow-sm"
          >
            Join Free →
          </Link>
          <Link
            href="/search"
            className="bg-purple-500 text-white font-semibold px-8 py-3 rounded-full hover:bg-purple-400 transition text-sm"
          >
            Search an Event
          </Link>
        </div>
      </div>

    </div>
  );
}
