import Link from "next/link";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Smart City Service Platform
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
          Report city issues, track their resolution in real time, and help build a better city together.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          {session ? (
            <>
              <Link
                href="/report"
                className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
              >
                Report an Issue
              </Link>
              <Link
                href="/dashboard"
                className="px-8 py-3 bg-white text-indigo-600 border border-indigo-300 rounded-xl font-semibold hover:bg-indigo-50 transition"
              >
                My Reports
              </Link>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              Get Started
            </Link>
          )}
          <Link
            href="/map"
            className="px-8 py-3 bg-white text-gray-700 border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition"
          >
            View City Map
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          {[
            { icon: "📍", title: "Pin It", desc: "Drop a pin on the map exactly where the problem is." },
            { icon: "🔔", title: "Get Notified", desc: "Receive SMS and email updates as your issue is resolved." },
            { icon: "🤖", title: "AI Assisted", desc: "Gemini automatically categorizes and prioritizes your report." },
          ].map((f) => (
            <div key={f.title} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{f.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
