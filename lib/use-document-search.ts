"use client";

import { useCallback, useState } from "react";
import {
  searchDocuments,
  type DocumentSearchHit,
  type DocumentSearchResponse,
  type SearchDocumentsInput,
} from "@/lib/document-client";

export type { DocumentSearchHit, DocumentSearchResponse, SearchDocumentsInput };

export function useDocumentSearch() {
  const [results, setResults] = useState<DocumentSearchHit[]>([]);
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (input: SearchDocumentsInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await searchDocuments(input);
      setResults(response.results);
      setQuery(response.query);
      setCategories(response.categories);
      console.log(
        "useDocumentSearch:",
        response.query,
        response.categories,
        response.results.length,
      );
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Search failed";
      setResults([]);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { results, query, categories, isLoading, error, search };
}
