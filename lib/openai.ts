import { createHash } from "crypto";
import OpenAI from "openai";

export const embeddingModel = "text-embedding-3-small";
export const embeddingDimensions = 1536;

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** Deterministic dev fallback when OPENAI_API_KEY is not set. */
export function createMockEmbedding(input: string): number[] {
  let state = createHash("sha256").update(input).digest();
  const embedding: number[] = [];

  for (let i = 0; i < embeddingDimensions; i++) {
    state = createHash("sha256").update(state).digest();
    embedding.push(state.readUInt16BE(0) / 32767.5 - 1);
  }

  return embedding;
}

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set. Add it to .env.");
  }

  return new OpenAI({ apiKey });
}

export async function createEmbedding(input: string) {
  if (!isOpenAIConfigured()) {
    return createMockEmbedding(input);
  }

  const client = getOpenAIClient();
  const response = await client.embeddings.create({
    model: embeddingModel,
    input,
    dimensions: embeddingDimensions,
  });
  const embedding = response.data[0]?.embedding;

  if (!embedding) {
    throw new Error("OpenAI returned no embedding.");
  }

  return embedding;
}
