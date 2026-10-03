import { searchDocuments, type DocumentHit } from "@/lib/document-search";
import { chatModel, getOpenAIClient } from "@/lib/openai";
import type { Agent } from "./types";

const sourceLimit = 5;
const sourceChars = 4000;

const instructions = `You answer questions for Hub Małopolskich Innowacji using only the numbered sources provided.
Reply in the language of the question. Cite sources inline as [1], [2].
If the sources do not contain the answer, say so plainly instead of guessing.`;

function formatSources(sources: DocumentHit[]): string {
  return sources
    .map((source, index) => `[${index + 1}]\n${source.body.slice(0, sourceChars)}`)
    .join("\n\n");
}

function mockAnswer(sources: DocumentHit[]): string {
  if (sources.length === 0) {
    return "Nie znaleziono dokumentów pasujących do pytania.";
  }

  const excerpts = sources
    .map((source, index) => `[${index + 1}] ${source.body.slice(0, 200).trim()}…`)
    .join("\n");
  return `Tryb testowy (brak OPENAI_API_KEY). Najbliższe fragmenty:\n${excerpts}`;
}

export const answerAgent: Agent = {
  name: "answer",
  description:
    "Answers a specific question (how, why, what, who) in prose, grounded in the documents. Pick it when the user asks something that needs an explanation or summary.",
  async run({ message, query, categories }) {
    const sources = await searchDocuments({ query, categories, limit: sourceLimit });
    const client = getOpenAIClient();

    if (!client || sources.length === 0) {
      return { kind: "answer", answer: mockAnswer(sources), sources };
    }

    const response = await client.responses.create({
      model: chatModel,
      instructions,
      input: `Sources:\n${formatSources(sources)}\n\nQuestion: ${message}`,
    });

    return { kind: "answer", answer: response.output_text.trim(), sources };
  },
};
