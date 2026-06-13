import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/notifications — fetch the 20 most recent IN_APP notifications for the user
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id, channel: "IN_APP" },
    orderBy: { sentAt: "desc" },
    take: 20,
    include: { issue: { select: { id: true, title: true, status: true } } },
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: session.user.id, channel: "IN_APP", read: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

// PATCH /api/notifications — mark all as read
export async function PATCH() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.notification.updateMany({
    where: { userId: session.user.id, channel: "IN_APP", read: false },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}
