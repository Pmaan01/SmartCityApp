import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import IssueMap from "@/components/map/IssueMap";
import IssueComments from "./IssueComments";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED:   "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  IN_REVIEW:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  ASSIGNED:    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400",
  RESOLVED:    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  CLOSED:      "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500",
};

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Low",    color: "text-emerald-600 dark:text-emerald-400" },
  2: { label: "Medium", color: "text-amber-600 dark:text-amber-400" },
  3: { label: "High",   color: "text-red-600 dark:text-red-400" },
};

const CATEGORY_ICONS: Record<string, string> = {
  POTHOLE:        "🕳️",
  STREETLIGHT:    "💡",
  GRAFFITI:       "🎨",
  GARBAGE:        "🗑️",
  FLOODING:       "🌊",
  TRAFFIC_SIGNAL: "🚦",
  SIDEWALK:       "🚶",
  PARK:           "🌳",
  NOISE:          "📢",
  OTHER:          "📌",
};

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      reportedBy: { select: { id: true, name: true, image: true } },
      comments: {
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!issue) notFound();

  const priority = PRIORITY_LABELS[issue.priority] ?? PRIORITY_LABELS[1];
  const icon = CATEGORY_ICONS[issue.category] ?? "📌";

  const serializedComments = issue.comments.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition mb-6"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to My Reports
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{icon}</span>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  {issue.category.replace(/_/g, " ")}
                </span>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold whitespace-nowrap ${STATUS_COLORS[issue.status]}`}>
                {issue.status.replace(/_/g, " ")}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{issue.title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{issue.description}</p>
          </div>

          {/* Photo */}
          {issue.photoUrl && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
              <img
                src={issue.photoUrl}
                alt="Issue photo"
                className="w-full max-h-80 object-cover"
              />
            </div>
          )}

          {/* AI Summary */}
          {issue.aiSummary && (
            <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  AI Analysis
                </span>
              </div>
              <p className="text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed">{issue.aiSummary}</p>
            </div>
          )}

          {/* Map */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
            <div className="px-5 pt-4 pb-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Location</h2>
              {issue.address && (
                <p className="text-xs text-gray-400 mt-0.5">📍 {issue.address}</p>
              )}
            </div>
            <div className="h-52">
              <IssueMap lat={issue.lat} lng={issue.lng} />
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
            <IssueComments
              issueId={issue.id}
              initialComments={serializedComments}
              currentUserId={session!.user.id}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Details */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Details</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Priority</span>
                <span className={`font-semibold ${priority.color}`}>
                  {"●".repeat(issue.priority)}{"○".repeat(3 - issue.priority)} {priority.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Reported</span>
                <span className="text-gray-700 dark:text-gray-300">
                  {new Date(issue.createdAt).toLocaleDateString("en-US", {
                    year: "numeric", month: "short", day: "numeric"
                  })}
                </span>
              </div>
              {issue.resolvedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Resolved</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {new Date(issue.resolvedAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric"
                    })}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Category</span>
                <span className="text-gray-700 dark:text-gray-300">{issue.category.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Comments</span>
                <span className="text-gray-700 dark:text-gray-300">{issue.comments.length}</span>
              </div>
            </div>
          </div>

          {/* Reporter */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Reported by</h2>
            <div className="flex items-center gap-3">
              {issue.reportedBy.image ? (
                <img src={issue.reportedBy.image} alt="" className="w-9 h-9 rounded-full" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">
                    {issue.reportedBy.name?.[0]?.toUpperCase() ?? "?"}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{issue.reportedBy.name}</p>
                {issue.reportedBy.id === session?.user.id && (
                  <p className="text-xs text-gray-400">You</p>
                )}
              </div>
            </div>
          </div>

          {/* Status timeline */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Progress</h2>
            {(["SUBMITTED", "IN_REVIEW", "IN_PROGRESS", "RESOLVED"] as const).map((s, i) => {
              const statuses = ["SUBMITTED", "IN_REVIEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];
              const currentIdx = statuses.indexOf(issue.status);
              const stepIdx = statuses.indexOf(s);
              const done = currentIdx >= stepIdx;
              const active = issue.status === s;
              return (
                <div key={s} className="flex items-center gap-3 mb-3 last:mb-0">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    done ? "bg-indigo-500" : "bg-gray-200 dark:bg-gray-700"
                  } ${active ? "ring-2 ring-indigo-300 dark:ring-indigo-700" : ""}`} />
                  {i < 3 && (
                    <div className="absolute ml-1 mt-5 w-0.5 h-4 bg-gray-100 dark:bg-gray-800" />
                  )}
                  <span className={`text-xs ${done ? "text-gray-800 dark:text-gray-200 font-medium" : "text-gray-400"}`}>
                    {s.replace(/_/g, " ")}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
