import { NextResponse } from "next/server";
import { runAgentRouter } from "@/lib/agents/router";

const maxMessageLength = 2000;

export async function POST(request: Request) {
  let body: { message?: unknown; categories?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }
  if (message.length > maxMessageLength) {
    return NextResponse.json(
      { error: `message must be at most ${maxMessageLength} characters` },
      { status: 400 },
    );
  }

  const categories = Array.isArray(body.categories)
    ? [
        ...new Set(
          body.categories
            .filter((value): value is string => typeof value === "string")
            .map((value) => value.trim().toLowerCase())
            .filter(Boolean),
        ),
      ]
    : [];

  const result = await runAgentRouter(message, categories);

  console.log("agent POST:", result.agent, result.mode, message);

  return NextResponse.json(result);
}
