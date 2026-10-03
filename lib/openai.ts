import OpenAI from "openai";

export const embeddingModel = "text-embedding-3-small";
export const embeddingDimensions = 1536;

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set. Add it to .env.");
  }

  return new OpenAI({ apiKey });
}

export async function createEmbedding(input: string) {
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
