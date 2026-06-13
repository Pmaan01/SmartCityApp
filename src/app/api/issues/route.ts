import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { categorizeIssue } from "@/lib/gemini";
import type { IssueCategory } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  const issues = await prisma.issue.findMany({
    where: {
      ...(status && { status: status as never }),
      ...(category && { category: category as IssueCategory }),
    },
    include: {
      reportedBy: { select: { id: true, name: true, image: true } },
      assignedTo: { select: { id: true, name: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(issues);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, lat, lng, address, photoUrl } = body;

  // Use Gemini to auto-categorize
  let category: IssueCategory = "OTHER";
  let priority = 1;
  let aiSummary: string | undefined;
  try {
    const ai = await categorizeIssue(description);
    category = ai.category as IssueCategory;
    priority = ai.priority;
    aiSummary = ai.summary;
  } catch {
    if (body.category) category = body.category;
  }

  const issue = await prisma.issue.create({
    data: {
      title,
      description,
      category,
      priority,
      aiSummary,
      lat,
      lng,
      address,
      photoUrl,
      reportedById: session.user.id,
    },
  });

  return NextResponse.json(issue, { status: 201 });
}
