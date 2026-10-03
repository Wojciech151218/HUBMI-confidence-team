import type { DocumentHit } from "@/lib/document-search";

export const agentNames = ["search", "answer", "help"] as const;

export type AgentName = (typeof agentNames)[number];

export type AgentInput = {
  // The user's original message.
  message: string;
  // The router's rewrite of the message into a search query.
  query: string;
  categories: string[];
};

export type AgentOutput =
  | { kind: "results"; results: DocumentHit[] }
  | { kind: "answer"; answer: string; sources: DocumentHit[] };

export type Agent = {
  name: AgentName;
  // Shown to the routing model, so it should say when to pick this agent.
  description: string;
  run(input: AgentInput): Promise<AgentOutput>;
};
