import { NextResponse } from "next/server";
import { parseCategories, parseMessage, parseUserId } from "@/lib/agents/request";
import { ensureUserThread, runAgentTurn } from "@/lib/agents/thread";

export async function POST(request: Request) {
  let body: { message?: unknown; userId?: unknown; categories?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = parseMessage(body.message);
  if (typeof message !== "string") {
    return NextResponse.json({ error: message.error }, { status: 400 });
  }

  const userId = parseUserId(body.userId);
  if (typeof userId !== "number") {
    return NextResponse.json({ error: userId.error }, { status: 400 });
  }

  const thread = await ensureUserThread(userId);
  if (!thread) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const categories = parseCategories(body.categories);
  const result = await runAgentTurn({
    threadId: thread.threadId,
    message,
    categories,
  });

  console.log("agent POST:", userId, thread.threadId, message);

  return NextResponse.json({
    answer: result.answer,
    messages: result.messages,
    threadId: thread.threadId,
  });
}
