import { NextResponse } from "next/server";
import { parseUserId } from "@/lib/agents/request";
import { forgetUserThread } from "@/lib/agents/thread";

export async function POST(request: Request) {
  let body: { userId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = parseUserId(body.userId);
  if (typeof userId !== "number") {
    return NextResponse.json({ error: userId.error }, { status: 400 });
  }

  const thread = await forgetUserThread(userId);
  if (!thread) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  console.log("agent POST forget:", userId, thread.threadId);
  return NextResponse.json({ messages: [], threadId: thread.threadId });
}
