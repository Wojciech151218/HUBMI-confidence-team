import { searchDocuments } from "@/lib/document-search";
import type { Agent } from "./types";

export const searchAgent: Agent = {
  name: "search",
  description:
    "Lists documents (innovation models, projects) matching a topic or keywords. Pick it when the user wants to find, browse or list materials rather than get an explanation.",
  async run({ query, categories }) {
    const results = await searchDocuments({ query, categories, limit: 10 });
    return { kind: "results", results };
  },
};
