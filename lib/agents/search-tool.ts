import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { searchDocuments } from "@/lib/document-search";

export function searchQueryInstructions(categoryNames: string[]): string {
  const list = categoryNames.length > 0 ? categoryNames.join(", ") : "brak";
  return `Wywołaj search_documents, zanim odpowiesz na pytanie o materiał z bazy. Nie odkładaj wyszukiwania i nie proponuj, że poszukasz później.
Nie wywołuj go, gdy pytanie dotyczy samej usługi albo wykracza poza zakres bazy.

Dwa sposoby wyszukiwania:
- Semantyczne (parametr query): krótkie hasło albo temat w języku użytkownika. Zostaw słowa tematu, pomiń grzeczności i całe zdanie pytające.
- Kategorie (parametr categories): opcjonalny filtr. Podawaj wyłącznie dokładne nazwy z listy, małymi literami. Dokument pasuje, gdy ma którąkolwiek z nich. Pusta lista, gdy użytkownik nie zawęża dziedziny.

Dostępne kategorie: ${list}`;
}

export function searchToolDescription(categoryNames: string[]): string {
  return [
    "Szuka wyłącznie dokumentów Hubu Małopolskich Innowacji: modeli innowacji społecznych, projektów, gier edukacyjnych i formularzy.",
    "Wywołaj to narzędzie od razu, gdy użytkownik pyta o taki materiał. Nie używaj, gdy pytanie dotyczy samej usługi albo wykracza poza zakres bazy.",
    searchQueryInstructions(categoryNames),
  ].join("\n\n");
}

const excerptChars = 500;
const defaultLimit = 5;
const maxLimit = 10;

export const searchDocumentsTool = tool(
  async ({ query, categories, limit }) => {
    const results = await searchDocuments({
      query,
      categories: categories ?? [],
      limit: limit ?? defaultLimit,
    });

    return JSON.stringify(
      results.map((hit) => ({
        id: hit.id,
        excerpt: hit.body.slice(0, excerptChars),
        categories: hit.categories,
        similarity: Number(hit.similarity.toFixed(3)),
        minioUrl: hit.minioUrl,
      })),
    );
  },
  {
    name: "search_documents",
    description:
      "Szuka wyłącznie dokumentów Hubu Małopolskich Innowacji. Wywołaj od razu przy pytaniu o materiał z bazy, potem odpowiedz. Nie używaj, gdy pytanie dotyczy samej usługi albo wykracza poza zakres bazy.",
    schema: z.object({
      query: z
        .string()
        .describe("Hasło lub temat do wyszukiwania semantycznego, w języku użytkownika"),
      categories: z
        .array(z.string())
        .optional()
        .describe(
          "Opcjonalny filtr: dokładne nazwy kategorii małymi literami, wyłącznie z listy w instrukcji",
        ),
      limit: z
        .number()
        .int()
        .min(1)
        .max(maxLimit)
        .optional()
        .describe(`Ile dokumentów zwrócić, od 1 do ${maxLimit}`),
    }),
  },
);
