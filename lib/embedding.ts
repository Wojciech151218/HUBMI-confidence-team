import OpenAI from "openai";

export const embeddingModel = "text-embedding-3-small";
export const embeddingDimensions = 1536;

export type EmbeddingMode = "openai" | "local";

export type EmbeddingProvider = {
  readonly mode: EmbeddingMode;
  embed(input: string): Promise<number[]>;
};

// Polish/English filler words that would otherwise dominate short queries.
const stopwords = new Set(
  "a albo ale and by co czy dla do i in is jak jest lub na nie o od of oraz po przez sa sie the to w we z za ze".split(" "),
);

// Lowercase and fold diacritics ("Otyłości" -> "otylosci") so inflected and
// unaccented spellings share features.
function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2 && !stopwords.has(token));
}

// FNV-1a: a fast, stable string hash for feature hashing.
function hash(feature: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < feature.length; i++) {
    h ^= feature.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Keyword embedding used without an OpenAI key: hashes whole words, short stems
// (Polish inflection: "pracy"/"praca", "bezdomnych"/"bezdomność") and character
// trigrams into a fixed-size vector, so texts sharing vocabulary get a high cosine.
function createLocalEmbedding(input: string): number[] {
  const embedding = new Array<number>(embeddingDimensions).fill(0);
  const add = (feature: string, weight: number) => {
    const h = hash(feature);
    embedding[h % embeddingDimensions] += h & 0x80000000 ? -weight : weight;
  };

  for (const token of tokenize(input)) {
    add(`w:${token}`, 1);
    if (token.length >= 5) add(`p4:${token.slice(0, 4)}`, 1);
    if (token.length >= 7) add(`p6:${token.slice(0, 6)}`, 1);
    const padded = ` ${token} `;
    for (let i = 0; i + 3 <= padded.length; i++) add(`t:${padded.slice(i, i + 3)}`, 0.3);
  }

  const norm = Math.hypot(...embedding);
  if (norm === 0) {
    // pgvector returns NaN for cosine against a zero vector.
    embedding[0] = 1;
    return embedding;
  }
  return embedding.map((value) => value / norm);
}

function createLocalProvider(): EmbeddingProvider {
  return {
    mode: "local",
    embed(input) {
      return Promise.resolve(createLocalEmbedding(input));
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
      : createLocalProvider();
  }

  return globalForEmbedding.embeddingProvider;
}

export async function createEmbedding(input: string): Promise<number[]> {
  return getEmbeddingProvider().embed(input);
}
