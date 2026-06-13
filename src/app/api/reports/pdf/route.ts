import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PDF generation happens client-side with jsPDF.
// This endpoint returns the raw data needed for the PDF.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // format: YYYY-MM
  const [year, monthNum] = month ? month.split("-").map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];

  const start = new Date(year, monthNum - 1, 1);
  const end = new Date(year, monthNum, 0, 23, 59, 59);

  const [issues, total, resolved, byCategory] = await Promise.all([
    prisma.issue.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { reportedBy: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.issue.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.issue.count({ where: { createdAt: { gte: start, lte: end }, status: "RESOLVED" } }),
    prisma.issue.groupBy({
      by: ["category"],
      where: { createdAt: { gte: start, lte: end } },
      _count: { category: true },
    }),
  ]);

  return NextResponse.json({
    period: `${year}-${String(monthNum).padStart(2, "0")}`,
    summary: { total, resolved, open: total - resolved },
    byCategory,
    issues,
  });
}
