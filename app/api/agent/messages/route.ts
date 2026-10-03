import { NextResponse } from "next/server";
import { parseUserId } from "@/lib/agents/request";
import { getUserById, loadThreadMessages } from "@/lib/agents/thread";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = parseUserId(searchParams.get("userId"));
  if (typeof userId !== "number") {
    return NextResponse.json({ error: userId.error }, { status: 400 });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.threadId) {
    return NextResponse.json({ messages: [], threadId: null });
  }

  const messages = await loadThreadMessages(user.threadId);
  console.log("agent GET messages:", userId, user.threadId, messages.length);
  return NextResponse.json({ messages, threadId: user.threadId });
}
