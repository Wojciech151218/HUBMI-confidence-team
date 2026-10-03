import type { BaseMessage } from "@langchain/core/messages";
import { User } from "@/db/user";
import { getDataSource } from "@/lib/data-source";
import { getCheckpointer } from "./checkpointer";
import { getAgentGraph, threadConfig } from "./graph";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function messageText(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }
  if (!Array.isArray(content)) {
    return "";
  }
  return content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }
      if (part && typeof part === "object" && "text" in part) {
        return String(part.text ?? "");
      }
      return "";
    })
    .join("")
    .trim();
}

export function serializeThreadMessages(messages: BaseMessage[]): ChatMessage[] {
  const visible: ChatMessage[] = [];

  for (const message of messages) {
    const type = message.getType();
    const content = messageText(message.content);
    if (!content) {
      continue;
    }
    if (type === "human") {
      visible.push({ role: "user", content });
    } else if (type === "ai") {
      visible.push({ role: "assistant", content });
    }
  }

  return visible;
}

export function lastAssistantText(messages: ChatMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === "assistant") {
      return messages[index].content;
    }
  }
  return "";
}

export async function getUserById(userId: number): Promise<User | null> {
  const ds = await getDataSource();
  return ds.getRepository(User).findOne({ where: { id: userId } });
}

export async function ensureUserThread(userId: number): Promise<{ user: User; threadId: string } | null> {
  const ds = await getDataSource();
  const repo = ds.getRepository(User);
  const user = await repo.findOne({ where: { id: userId } });
  if (!user) {
    return null;
  }

  if (user.threadId) {
    return { user, threadId: user.threadId };
  }

  user.threadId = crypto.randomUUID();
  await repo.save(user);
  return { user, threadId: user.threadId };
}

export async function loadThreadMessages(threadId: string): Promise<ChatMessage[]> {
  const graph = await getAgentGraph();
  const snapshot = await graph.getState(threadConfig(threadId));
  const messages = snapshot.values.messages ?? [];
  return serializeThreadMessages(messages);
}

export async function runAgentTurn(options: {
  threadId: string;
  message: string;
  categories?: string[];
}): Promise<{ answer: string; messages: ChatMessage[] }> {
  const graph = await getAgentGraph();
  const result = await graph.invoke(
    { input: options.message, categories: options.categories ?? [] },
    threadConfig(options.threadId),
  );
  const messages = serializeThreadMessages(result.messages ?? []);
  return { answer: lastAssistantText(messages), messages };
}

export async function forgetUserThread(userId: number): Promise<{ user: User; threadId: string } | null> {
  const ds = await getDataSource();
  const repo = ds.getRepository(User);
  const user = await repo.findOne({ where: { id: userId } });
  if (!user) {
    return null;
  }

  if (user.threadId) {
    const checkpointer = await getCheckpointer();
    await checkpointer.deleteThread(user.threadId);
  }

  user.threadId = crypto.randomUUID();
  await repo.save(user);
  return { user, threadId: user.threadId };
}
