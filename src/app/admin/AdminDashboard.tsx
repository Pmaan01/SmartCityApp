"use client";

import { useState, useTransition } from "react";

type Issue = {
  id: string;
  title: string;
  category: string;
  status: string;
  priority: number;
  address: string | null;
  aiSummary: string | null;
  createdAt: string;
  reportedBy: { name: string | null; image: string | null } | null;
  assignedTo: { name: string | null } | null;
  _count: { comments: number };
};

const STATUS_OPTIONS = ["SUBMITTED", "IN_REVIEW", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const STATUS_STYLES: Record<string, string> = {
  SUBMITTED: "bg-gray-800 text-gray-300",
  IN_REVIEW: "bg-blue-900/60 text-blue-300",
  ASSIGNED: "bg-purple-900/60 text-purple-300",
  IN_PROGRESS: "bg-amber-900/60 text-amber-300",
  RESOLVED: "bg-green-900/60 text-green-300",
  CLOSED: "bg-gray-800/60 text-gray-500",
};

const PRIORITY_COLORS: Record<number, string> = {
  1: "bg-gray-500",
  2: "bg-amber-500",
  3: "bg-red-500",
};

const PRIORITY_LABELS: Record<number, string> = { 1: "Low", 2: "Med", 3: "High" };

const CATEGORY_LABELS: Record<string, string> = {
  POTHOLE: "Pothole", STREETLIGHT: "Streetlight", GRAFFITI: "Graffiti",
  GARBAGE: "Garbage", FLOODING: "Flooding", TRAFFIC_SIGNAL: "Traffic Signal",
  SIDEWALK: "Sidewalk", PARK: "Park", NOISE: "Noise", OTHER: "Other",
};

type Stats = {
  total: number;
  submitted: number;
  inProgress: number;
  resolved: number;
  highPriority: number;
};

export default function AdminDashboard({ initialIssues, stats }: { initialIssues: Issue[]; stats: Stats }) {
  const [issues, setIssues] = useState(initialIssues);
  const [filter, setFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  const filtered = issues.filter((i) => {
    const statusMatch = filter === "ALL" || i.status === filter;
    const categoryMatch = categoryFilter === "ALL" || i.category === categoryFilter;
    return statusMatch && categoryMatch;
  });

  async function updateStatus(id: string, status: string) {
    startTransition(async () => {
      await fetch(`/api/issues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    });
  }

  async function updatePriority(id: string, priority: number) {
    startTransition(async () => {
      await fetch(`/api/issues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority }),
      });
      setIssues((prev) => prev.map((i) => (i.id === id ? { ...i, priority } : i)));
    });
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: "Total Issues", value: stats.total, color: "text-white", bg: "bg-gray-800/60" },
          { label: "Pending", value: stats.submitted, color: "text-blue-400", bg: "bg-blue-900/20 border border-blue-900/40" },
          { label: "In Progress", value: stats.inProgress, color: "text-amber-400", bg: "bg-amber-900/20 border border-amber-900/40" },
          { label: "Resolved", value: stats.resolved, color: "text-green-400", bg: "bg-green-900/20 border border-green-900/40" },
          { label: "High Priority", value: stats.highPriority, color: "text-red-400", bg: "bg-red-900/20 border border-red-900/40" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.bg}`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {["ALL", ...STATUS_OPTIONS].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                filter === s
                  ? "bg-violet-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
              }`}
            >
              {s === "ALL" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
          <option value="ALL">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Issues count */}
      <p className="text-sm text-gray-500">{filtered.length} issue{filtered.length !== 1 ? "s" : ""}</p>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Priority</th>
                <th className="text-left px-4 py-3 font-medium">Issue</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Reporter</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-600">No issues found</td>
                </tr>
              ) : (
                filtered.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-800/30 transition-colors group">
                    {/* Priority */}
                    <td className="px-4 py-3">
                      <select
                        value={issue.priority}
                        onChange={(e) => updatePriority(issue.id, Number(e.target.value))}
                        className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
                        disabled={isPending}
                      >
                        {[1, 2, 3].map((p) => (
                          <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                        ))}
                      </select>
                      <div className={`w-1.5 h-1.5 rounded-full inline-block ml-1.5 ${PRIORITY_COLORS[issue.priority]}`} />
                    </td>

                    {/* Title */}
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-gray-200 truncate">{issue.title}</p>
                      {issue.aiSummary && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{issue.aiSummary}</p>
                      )}
                      {issue._count.comments > 0 && (
                        <span className="text-xs text-gray-600 mt-0.5 inline-block">
                          {issue._count.comments} comment{issue._count.comments !== 1 ? "s" : ""}
                        </span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                        {CATEGORY_LABELS[issue.category] ?? issue.category}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <select
                        value={issue.status}
                        onChange={(e) => updateStatus(issue.id, e.target.value)}
                        disabled={isPending}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-violet-500 ${STATUS_STYLES[issue.status]}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s.replace("_", " ")}</option>
                        ))}
                      </select>
                    </td>

                    {/* Reporter */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {issue.reportedBy?.image && (
                          <img src={issue.reportedBy.image} alt="" className="w-5 h-5 rounded-full" />
                        )}
                        <span className="text-xs text-gray-400 truncate max-w-[100px]">
                          {issue.reportedBy?.name ?? "Unknown"}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(issue.createdAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
