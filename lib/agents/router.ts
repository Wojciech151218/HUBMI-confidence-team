import { listCategoryNames } from "@/lib/document-search";
import { chatModel, getOpenAIClient } from "@/lib/openai";
import { answerAgent } from "./answer-agent";
import { isOffTopicGeneralQuestion } from "./guardrails";
import { helpAgent } from "./help-agent";
import { searchAgent } from "./search-agent";
import { searchQueryInstructions } from "./search-tool";
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
  categories: string[];
  reason: string;
  mode: "openai" | "mock";
};

export type RouterResult = RouteDecision & AgentOutput;

function routingSchema(categoryNames: string[]) {
  const categoryItem =
    categoryNames.length > 0
      ? { type: "string", enum: categoryNames }
      : { type: "string" };
  return {
    type: "object",
    properties: {
      agent: { type: "string", enum: [...agentNames] },
      query: { type: "string" },
      categories: { type: "array", items: categoryItem },
      reason: { type: "string" },
    },
    required: ["agent", "query", "categories", "reason"],
    additionalProperties: false,
  };
}

function routingInstructions(categoryNames: string[]): string {
  const list = Object.values(agents)
    .map((agent) => `- ${agent.name}: ${agent.description}`)
    .join("\n");
  return `Kierujesz wiadomości użytkowników Hubu Małopolskich Innowacji, wyszukiwarki modeli innowacji społecznych (głównie po polsku).
Wybierz dokładnie jednego agenta:
${list}
Pytania o samą usługę albo spoza zakresu bazy kieruj do help.

${searchQueryInstructions(categoryNames)}

Pole query to hasło do wyszukiwania semantycznego. Pole categories to filtr kategorii (albo pusta tablica).
Podaj powód w jednym zdaniu.`;
}

function knownCategories(picked: string[], categoryNames: string[]): string[] {
  const known = new Set(categoryNames.map((name) => name.toLowerCase()));
  return [
    ...new Set(
      picked
        .map((name) => name.trim().toLowerCase())
        .filter((name) => known.has(name)),
    ),
  ];
}

const helpPattern =
  /^(cześć|czesc|hej|witaj|dzień dobry|pomoc|help|hi|hello)(?=[\s!,.?]|$)|co (potrafisz|umiesz)|jak (to )?działa(sz)? (ta )?(strona|wyszukiwarka|hub)/i;
const questionPattern =
  /\?\s*$|^(jak|jaki|jaka|jakie|dlaczego|czemu|czym|co|kto|kiedy|gdzie|ile|czy|po co|how|why|what|who|when|where|which|is|are|does|can)\b/i;

// Keyword fallback used when OPENAI_API_KEY is not set.
function mockRoute(message: string): RouteDecision {
  if (isOffTopicGeneralQuestion(message) || helpPattern.test(message)) {
    return {
      agent: "help",
      query: message,
      categories: [],
      reason: "Powitanie albo pytanie o hub.",
      mode: "mock",
    };
  }
  if (questionPattern.test(message)) {
    return {
      agent: "answer",
      query: message,
      categories: [],
      reason: "Wiadomość brzmi jak pytanie.",
      mode: "mock",
    };
  }
  return {
    agent: "search",
    query: message,
    categories: [],
    reason: "Wiadomość brzmi jak hasła do wyszukiwania.",
    mode: "mock",
  };
}

export async function routeMessage(message: string): Promise<RouteDecision> {
  const client = getOpenAIClient();
  if (!client) {
    return mockRoute(message);
  }

  const categoryNames = await listCategoryNames();
  const response = await client.responses.create({
    model: chatModel,
    instructions: routingInstructions(categoryNames),
    input: message,
    text: {
      format: {
        type: "json_schema",
        name: "route",
        schema: routingSchema(categoryNames),
        strict: true,
      },
    },
  });

  const parsed = JSON.parse(response.output_text) as Omit<RouteDecision, "mode">;
  const agent = agentNames.includes(parsed.agent) ? parsed.agent : "search";
  const query = parsed.query.trim() || message;
  const categories = knownCategories(
    Array.isArray(parsed.categories) ? parsed.categories : [],
    categoryNames,
  );

  return { agent, query, categories, reason: parsed.reason, mode: "openai" };
}

export async function runAgentRouter(
  message: string,
  categories: string[] = [],
): Promise<RouterResult> {
  const decision = await routeMessage(message);
  const mergedCategories = [
    ...new Set(
      [...categories, ...decision.categories]
        .map((name) => name.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  const output = await agents[decision.agent].run({
    message,
    query: decision.query,
    categories: mergedCategories,
  });

  return { ...decision, categories: mergedCategories, ...output };
}
