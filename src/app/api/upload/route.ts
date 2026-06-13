import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminStorage } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = file.name.split(".").pop();
  const path = `issues/${session.user.id}/${Date.now()}.${ext}`;
  const bytes = await file.arrayBuffer();

  const bucket = adminStorage.bucket();
  const fileRef = bucket.file(path);

  await fileRef.save(Buffer.from(bytes), { contentType: file.type });
  await fileRef.makePublic();

  const url = `https://storage.googleapis.com/${bucket.name}/${path}`;
  return NextResponse.json({ url });
}
