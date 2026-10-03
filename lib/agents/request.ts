export const maxMessageLength = 2000;

export function parseUserId(value: unknown): number | { error: string } {
  const id = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(id) || id < 1) {
    return { error: "userId is required" };
  }
  return id;
}

export function parseCategories(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return [
    ...new Set(
      value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

export function parseMessage(value: unknown): string | { error: string } {
  const message = typeof value === "string" ? value.trim() : "";
  if (!message) {
    return { error: "message is required" };
  }
  if (message.length > maxMessageLength) {
    return { error: `message must be at most ${maxMessageLength} characters` };
  }
  return message;
}
