export type DocumentSearchHit = {
  id: number;
  body: string;
  minioUrl: string | null;
  categories: string[];
  similarity: number;
  createdAt: string;
};

export type DocumentSearchResponse = {
  query: string;
  categories: string[];
  results: DocumentSearchHit[];
};

export type SearchDocumentsInput = {
  q: string;
  categories?: string[];
  limit?: number;
};

class DocumentClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "DocumentClientError";
    this.status = status;
  }
}

async function parseError(response: Response): Promise<never> {
  let message = response.statusText;
  try {
    const data = (await response.json()) as { error?: string };
    if (data.error) {
      message = data.error;
    }
  } catch {
    // keep statusText
  }
  throw new DocumentClientError(message, response.status);
}

export async function searchDocuments(
  input: SearchDocumentsInput,
): Promise<DocumentSearchResponse> {
  const query = input.q.trim();
  if (!query) {
    throw new DocumentClientError("Provide q to search", 400);
  }

  const search = new URLSearchParams();
  search.set("q", query);
  for (const category of input.categories ?? []) {
    const name = category.trim();
    if (name) {
      search.append("category", name);
    }
  }
  if (input.limit !== undefined) {
    search.set("limit", String(input.limit));
  }

  const response = await fetch(`/api/documents/search?${search.toString()}`);
  if (!response.ok) {
    await parseError(response);
  }
  return response.json();
}
