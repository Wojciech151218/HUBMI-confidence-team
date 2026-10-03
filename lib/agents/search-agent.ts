import { searchDocuments } from "@/lib/document-search";
import type { Agent } from "./types";

export const searchAgent: Agent = {
  name: "search",
  description:
    "Wypisuje dokumenty (modele innowacji, projekty) pasujące do tematu lub haseł. Wybierz go, gdy użytkownik chce znaleźć, przejrzeć albo wylistować materiały, a nie dostać wyjaśnienia.",
  async run({ query, categories }) {
    const results = await searchDocuments({ query, categories, limit: 10 });
    return { kind: "results", results };
  },
};
