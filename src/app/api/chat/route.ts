import { NextRequest, NextResponse } from "next/server";
import { chatWithGemini } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const { message, history } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  try {
    const reply = await chatWithGemini(history ?? [], message);
    return NextResponse.json({ reply });
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    if (status === 429) {
      return NextResponse.json(
        { error: "I'm getting too many requests right now. Please wait a moment and try again." },
        { status: 429 }
      );
    }
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
