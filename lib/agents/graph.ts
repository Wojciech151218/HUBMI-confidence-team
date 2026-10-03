import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Annotation, END, MessagesAnnotation, START, StateGraph } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { searchDocuments } from "@/lib/document-search";
import { chatModel } from "@/lib/openai";
import { getCheckpointer } from "./checkpointer";
import { searchDocumentsTool } from "./search-tool";

const mockSourceLimit = 5;
const mockExcerptChars = 200;

const systemPrompt = `Jesteś asystentem Hubu Małopolskich Innowacji, wyszukiwarki modeli innowacji społecznych (głównie po polsku).
Zawsze wywołaj search_documents, zanim odpowiesz na pytanie o dokumenty, programy lub innowacje.
Odpowiadaj w języku użytkownika.
Po wyniku narzędzia napisz krótkie podsumowanie najbardziej trafnego dokumentu lub dokumentów: 2–4 zdania, bez eseju.
Jeśli nic przydatnego nie znaleziono, powiedz to wprost, zamiast zgadywać.`;

export const AgentState = Annotation.Root({
  ...MessagesAnnotation.spec,
  input: Annotation<string>({
    reducer: (_current, next) => next ?? "",
    default: () => "",
  }),
  categories: Annotation<string[]>({
    reducer: (_current, next) => next ?? [],
    default: () => [],
  }),
});

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
    .join("");
}

function lastHumanText(messages: typeof AgentState.State["messages"]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].getType() === "human") {
      return messageText(messages[index].content).trim();
    }
  }
  return "";
}

function mockSummary(bodies: string[]): string {
  if (bodies.length === 0) {
    return "Nie znaleziono dokumentów pasujących do pytania.";
  }
  const excerpts = bodies
    .map((body, index) => `[${index + 1}] ${body.slice(0, mockExcerptChars).trim()}…`)
    .join("\n");
  return `Tryb testowy (brak OPENAI_API_KEY). Najbliższe fragmenty:\n${excerpts}`;
}

async function initialNode(state: typeof AgentState.State) {
  const hasSystem = state.messages.some((message) => message.getType() === "system");
  if (hasSystem) {
    return {};
  }
  return { messages: [new SystemMessage(systemPrompt)] };
}

async function messageNode(state: typeof AgentState.State) {
  const input = state.input.trim();
  if (!input) {
    return { input: "" };
  }
  return {
    messages: [new HumanMessage(input)],
    input: "",
  };
}

async function llmNode(state: typeof AgentState.State) {
  if (!process.env.OPENAI_API_KEY) {
    const query = lastHumanText(state.messages);
    const hits = query
      ? await searchDocuments({
          query,
          categories: state.categories,
          limit: mockSourceLimit,
        })
      : [];
    return { messages: [new AIMessage(mockSummary(hits.map((hit) => hit.body)))] };
  }

  const model = new ChatOpenAI({
    model: chatModel,
    apiKey: process.env.OPENAI_API_KEY,
  }).bindTools([searchDocumentsTool]);

  const response = await model.invoke(state.messages);
  return { messages: [response] };
}

function compileGraph(checkpointer: Awaited<ReturnType<typeof getCheckpointer>>) {
  return new StateGraph(AgentState)
    .addNode("initial", initialNode)
    .addNode("message", messageNode)
    .addNode("llm", llmNode)
    .addNode("tools", new ToolNode([searchDocumentsTool]))
    .addEdge(START, "initial")
    .addEdge("initial", "message")
    .addEdge("message", "llm")
    .addConditionalEdges("llm", toolsCondition, ["tools", END])
    .addEdge("tools", "llm")
    .compile({ checkpointer });
}

const globalForGraph = globalThis as unknown as {
  agentGraph?: ReturnType<typeof compileGraph>;
};

export async function getAgentGraph() {
  if (globalForGraph.agentGraph) {
    return globalForGraph.agentGraph;
  }

  const checkpointer = await getCheckpointer();
  const graph = compileGraph(checkpointer);
  globalForGraph.agentGraph = graph;
  return graph;
}

export function threadConfig(threadId: string) {
  return { configurable: { thread_id: threadId } };
}
