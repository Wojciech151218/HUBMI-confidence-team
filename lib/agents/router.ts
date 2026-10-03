import { chatModel, getOpenAIClient } from "@/lib/openai";
import { answerAgent } from "./answer-agent";
import { helpAgent } from "./help-agent";
import { searchAgent } from "./search-agent";
import { agentNames, type Agent, type AgentName, type AgentOutput } from "./types";

const agents: Record<AgentName, Agent> = {
  search: searchAgent,
  answer: answerAgent,
  help: helpAgent,
};

export type RouteDecision = {
  agent: AgentName;
  // The message rewritten as a short search query for the chosen agent.
  query: string;
  reason: string;
  mode: "openai" | "mock";
};

export type RouterResult = RouteDecision & AgentOutput;

const routingSchema = {
  type: "object",
  properties: {
    agent: { type: "string", enum: [...agentNames] },
    query: { type: "string" },
    reason: { type: "string" },
  },
  required: ["agent", "query", "reason"],
  additionalProperties: false,
};

function routingInstructions(): string {
  const list = Object.values(agents)
    .map((agent) => `- ${agent.name}: ${agent.description}`)
    .join("\n");
  return `You route user messages for Hub Małopolskich Innowacji, a search hub of social innovation models (mostly in Polish).
Pick exactly one agent:
${list}
Also rewrite the message as a concise search query in the message's language, keeping key topic words and dropping filler.
Give a one-sentence reason.`;
}

const helpPattern =
  /^(cześć|czesc|hej|witaj|dzień dobry|pomoc|help|hi|hello)(?=[\s!,.?]|$)|co (potrafisz|umiesz)|jak (to )?działa(sz)? (ta )?(strona|wyszukiwarka|hub)/i;
const questionPattern =
  /\?\s*$|^(jak|jaki|jaka|jakie|dlaczego|czemu|czym|co|kto|kiedy|gdzie|ile|czy|po co|how|why|what|who|when|where|which|is|are|does|can)\b/i;

// Keyword fallback used when OPENAI_API_KEY is not set.
function mockRoute(message: string): RouteDecision {
  if (helpPattern.test(message)) {
    return { agent: "help", query: message, reason: "Greeting or question about the hub.", mode: "mock" };
  }
  if (questionPattern.test(message)) {
    return { agent: "answer", query: message, reason: "Message reads as a question.", mode: "mock" };
  }
  return { agent: "search", query: message, reason: "Message reads as search keywords.", mode: "mock" };
}

export async function routeMessage(message: string): Promise<RouteDecision> {
  const client = getOpenAIClient();
  if (!client) {
    return mockRoute(message);
  }

  const response = await client.responses.create({
    model: chatModel,
    instructions: routingInstructions(),
    input: message,
    text: {
      format: { type: "json_schema", name: "route", schema: routingSchema, strict: true },
    },
  });

  const parsed = JSON.parse(response.output_text) as Omit<RouteDecision, "mode">;
  const agent = agentNames.includes(parsed.agent) ? parsed.agent : "search";
  const query = parsed.query.trim() || message;

  return { agent, query, reason: parsed.reason, mode: "openai" };
}

export async function runAgentRouter(
  message: string,
  categories: string[] = [],
): Promise<RouterResult> {
  const decision = await routeMessage(message);
  const output = await agents[decision.agent].run({
    message,
    query: decision.query,
    categories,
  });

  return { ...decision, ...output };
}
