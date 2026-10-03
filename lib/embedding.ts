import { createHash } from "crypto";
import OpenAI from "openai";

export const embeddingModel = "text-embedding-3-small";
export const embeddingDimensions = 1536;

export type EmbeddingMode = "openai" | "mock";

export type EmbeddingProvider = {
  readonly mode: EmbeddingMode;
  embed(input: string): Promise<number[]>;
};

function createMockEmbedding(input: string): number[] {
  let state = createHash("sha256").update(input).digest();
  const embedding: number[] = [];

  for (let i = 0; i < embeddingDimensions; i++) {
    state = createHash("sha256").update(state).digest();
    embedding.push(state.readUInt16BE(0) / 32767.5 - 1);
  }

  return embedding;
}

function createMockProvider(): EmbeddingProvider {
  return {
    mode: "mock",
    embed(input) {
      return Promise.resolve(createMockEmbedding(input));
    },
  };
}

function createOpenAIProvider(): EmbeddingProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set. Add it to .env.");
  }

  const client = new OpenAI({ apiKey });

  return {
    mode: "openai",
    async embed(input) {
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
    },
  };
}

const globalForEmbedding = globalThis as unknown as {
  embeddingProvider?: EmbeddingProvider;
};

export function getEmbeddingProvider(): EmbeddingProvider {
  if (!globalForEmbedding.embeddingProvider) {
    globalForEmbedding.embeddingProvider = process.env.OPENAI_API_KEY
      ? createOpenAIProvider()
      : createMockProvider();
  }

  return globalForEmbedding.embeddingProvider;
}

export async function createEmbedding(input: string): Promise<number[]> {
  return getEmbeddingProvider().embed(input);
}
