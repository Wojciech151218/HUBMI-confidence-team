import {
  AIMessage,
  type BaseMessage,
  HumanMessage,
  RemoveMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { Annotation, END, MessagesAnnotation, START, StateGraph } from "@langchain/langgraph";
import { ToolNode, toolsCondition } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { listCategoryNames, searchDocuments } from "@/lib/document-search";
import { chatModel } from "@/lib/openai";
import { getCheckpointer } from "./checkpointer";
import { isAboutService, isOffTopicGeneralQuestion, offTopicRefusal } from "./guardrails";
import { searchDocumentsTool, searchQueryInstructions, searchToolDescription } from "./search-tool";

const mockSourceLimit = 5;
const mockExcerptChars = 200;
export const agentRecursionLimit = 10;

function systemPrompt(categoryNames: string[]): string {
  return `Jesteś asystentem Hubu Małopolskich Innowacji. Twoim zadaniem jest pomagać w materiałach z bazy: innowacjach społecznych, projektach i formularzach związanych z Małopolską. Nie jesteś ogólnym chatbotem.

Odpowiadaj bez search_documents, gdy pytanie dotyczy samej usługi (czym jest hub, jak działa czat, powitanie) albo wykracza poza tę bazę. Wtedy wyjaśnij zakres prostymi słowami albo grzecznie odmów. Nie uzupełniaj braków ogólną wiedzą.

Gdy pytanie dotyczy materiału z bazy, najpierw wywołaj search_documents, potem odpowiedz na podstawie wyniku. Nie odkładaj wyszukiwania. Nie proponuj, że poszukasz później. Jeśli temat do bazy nie pasuje, nie wywołuj narzędzia i nie zgaduj.

${searchQueryInstructions(categoryNames)}

Odpowiadaj w języku użytkownika.
Po wyniku narzędzia napisz krótkie podsumowanie najbardziej trafnego dokumentu lub dokumentów: 2–4 zdania, bez eseju.
Jeśli nic przydatnego nie znaleziono, powiedz to wprost.`;
}

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

function searchedSinceLastHuman(messages: typeof AgentState.State["messages"]): boolean {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const type = messages[index].getType();
    if (type === "tool") {
      return true;
    }
    if (type === "human") {
      return false;
    }
  }
  return false;
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
  const categoryNames = await listCategoryNames();
  const prompt = systemPrompt(categoryNames);
  const system = state.messages.find((message) => message.getType() === "system");
  if (system && messageText(system.content) === prompt) {
    return {};
  }

  const messages: BaseMessage[] = [];
  if (system?.id) {
    messages.push(new RemoveMessage({ id: system.id }));
  }
  messages.push(new SystemMessage(prompt));
  return { messages };
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
  const query = lastHumanText(state.messages);
  if (isOffTopicGeneralQuestion(query)) {
    return { messages: [new AIMessage(offTopicRefusal(query))] };
  }

  if (!process.env.OPENAI_API_KEY) {
    const hits = query
      ? await searchDocuments({
          query,
          categories: state.categories,
          limit: mockSourceLimit,
        })
      : [];
    return { messages: [new AIMessage(mockSummary(hits.map((hit) => hit.body)))] };
  }

  const categoryNames = await listCategoryNames();
  searchDocumentsTool.description = searchToolDescription(categoryNames);

  const requireSearch = !isAboutService(query) && !searchedSinceLastHuman(state.messages);
  const model = new ChatOpenAI({
    model: chatModel,
    apiKey: process.env.OPENAI_API_KEY,
  }).bindTools([searchDocumentsTool], {
    tool_choice: requireSearch
      ? { type: "function", function: { name: "search_documents" } }
      : "auto",
  });

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
  return { configurable: { thread_id: threadId }, recursionLimit: agentRecursionLimit };
}
