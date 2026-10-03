export type AgentChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AgentMessagesResponse = {
  messages: AgentChatMessage[];
  threadId: string | null;
};

export type AgentTurnResponse = {
  answer: string;
  messages: AgentChatMessage[];
  threadId: string;
};

class AgentClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AgentClientError";
    this.status = status;
  }
}

async function parseError(response: Response): Promise<never> {
  let message = response.statusText;
  try {
    const data = (await response.json()) as { error?: string };
    if (data.error) {
      message = data.error;
    }
  } catch {
    // keep statusText
  }
  throw new AgentClientError(message, response.status);
}

export async function fetchAgentMessages(userId: number): Promise<AgentMessagesResponse> {
  const search = new URLSearchParams({ userId: String(userId) });
  const response = await fetch(`/api/agent/messages?${search.toString()}`);
  if (!response.ok) {
    await parseError(response);
  }
  return response.json();
}

export async function sendAgentMessage(input: {
  userId: number;
  message: string;
  categories?: string[];
}): Promise<AgentTurnResponse> {
  const response = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    await parseError(response);
  }
  return response.json();
}

export async function forgetAgentThread(userId: number): Promise<AgentMessagesResponse> {
  const response = await fetch("/api/agent/forget", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!response.ok) {
    await parseError(response);
  }
  return response.json();
}
