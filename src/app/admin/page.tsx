import { prisma } from "@/lib/prisma";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [issues, total, submitted, inProgress, resolved, highPriority] = await Promise.all([
    prisma.issue.findMany({
      include: {
        reportedBy: { select: { name: true, image: true } },
        assignedTo: { select: { name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    }),
    prisma.issue.count(),
    prisma.issue.count({ where: { status: { in: ["SUBMITTED", "IN_REVIEW"] } } }),
    prisma.issue.count({ where: { status: { in: ["ASSIGNED", "IN_PROGRESS"] } } }),
    prisma.issue.count({ where: { status: "RESOLVED" } }),
    prisma.issue.count({ where: { priority: 3, status: { notIn: ["RESOLVED", "CLOSED"] } } }),
  ]);

  const serialized = issues.map((i) => ({
    ...i,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  }));

  return (
    <AdminDashboard
      initialIssues={serialized}
      stats={{ total, submitted, inProgress, resolved, highPriority }}
    />
  );
}
