import OpenAI from "openai";

export const chatModel = process.env.OPENAI_CHAT_MODEL || "gpt-5.4-mini";

const globalForOpenAI = globalThis as unknown as {
  openai?: OpenAI;
};

// Returns null without OPENAI_API_KEY, so callers can fall back to mock behaviour.
export function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (!globalForOpenAI.openai) {
    globalForOpenAI.openai = new OpenAI({ apiKey });
  }

  return globalForOpenAI.openai;
}
