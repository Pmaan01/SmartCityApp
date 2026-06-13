import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "bg-gray-100 text-gray-600",
  IN_REVIEW: "bg-yellow-100 text-yellow-700",
  ASSIGNED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-100 text-gray-400",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>;
}) {
  const session = await auth();
  const { submitted } = await searchParams;

  const issues = await prisma.issue.findMany({
    where: { reportedById: session!.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Reports</h1>
        <Link
          href="/report"
          className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition"
        >
          + New Report
        </Link>
      </div>

      {submitted && (
        <div className="mb-6 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 text-green-700 dark:text-green-400 text-sm">
          ✓ Your report was submitted! We&apos;ll notify you when there&apos;s an update.
        </div>
      )}

      {issues.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No reports yet</p>
          <p className="text-sm mt-1">See something that needs fixing? Report it!</p>
          <Link href="/report" className="mt-4 inline-block px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition">
            Report an Issue
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <Link
              key={issue.id}
              href={`/issues/${issue.id}`}
              className="block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-start gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all group"
            >
              {issue.photoUrl && (
                <img src={issue.photoUrl} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{issue.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[issue.status]}`}>
                    {issue.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{issue.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>{issue.category.replace("_", " ")}</span>
                  <span>·</span>
                  <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
                  {issue.address && <><span>·</span><span className="truncate">📍 {issue.address}</span></>}
                </div>
              </div>
              <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 flex-shrink-0 mt-0.5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
