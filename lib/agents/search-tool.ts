import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { searchDocuments } from "@/lib/document-search";

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
      "Search Hub Małopolskich Innowacji documents by meaning. Use this before summarizing. Pass the user's topic as query.",
    schema: z.object({
      query: z.string().describe("Search query in the user's language"),
      categories: z
        .array(z.string())
        .optional()
        .describe("Optional category name filters, lowercase"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(maxLimit)
        .optional()
        .describe(`How many documents to return, 1-${maxLimit}`),
    }),
  },
);
