import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/auth/signin");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Top bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 3a1 1 0 000 2v8a2 2 0 002 2h1v1a1 1 0 102 0v-1h2v1a1 1 0 102 0v-1h1a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zM9 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" />
              </svg>
            </div>
            <span className="font-bold text-white text-sm tracking-tight">SmartCity <span className="text-violet-400">Admin</span></span>
          </div>

          <nav className="flex items-center gap-1">
            <Link href="/admin" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all">
              Dashboard
            </Link>
            <Link href="/map" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all">
              City Map
            </Link>
            <Link href="/dashboard" className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all">
              Citizen View
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {session.user.image && (
              <img src={session.user.image} alt="" className="w-7 h-7 rounded-full ring-1 ring-gray-700" />
            )}
            <span className="text-sm text-gray-400 hidden sm:block">{session.user.name?.split(" ")[0]}</span>
            <span className="text-xs bg-violet-900/60 text-violet-300 px-2 py-0.5 rounded-full font-medium">Admin</span>
          </div>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
            <button className="text-xs px-3 py-1.5 rounded-lg border border-gray-700 text-gray-500 hover:text-red-400 hover:border-red-900/60 transition-all">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="p-6">
        {children}
      </main>
    </div>
  );
}
