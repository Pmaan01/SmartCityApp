import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyStatusChange } from "@/lib/notifications";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: {
      reportedBy: { select: { id: true, name: true, image: true, email: true } },
      assignedTo: { select: { id: true, name: true } },
      comments: {
        include: { author: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!issue) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(issue);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !["ADMIN", "WORKER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status, assignedToId, priority } = body;

  const issue = await prisma.issue.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(assignedToId !== undefined && { assignedToId }),
      ...(priority && { priority }),
      ...(status === "RESOLVED" && { resolvedAt: new Date() }),
    },
  });

  // Push real-time update to Firebase (best-effort — don't fail the response if it errors)
  adminDb.ref(`issues/${id}/status`).set(issue.status).catch(() => {});

  // Notify citizen
  if (status) {
    await notifyStatusChange(id, status);
  }

  return NextResponse.json(issue);
}
