import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

const globalForCheckpointer = globalThis as unknown as {
  agentCheckpointer?: PostgresSaver;
  agentCheckpointerReady?: Promise<PostgresSaver>;
};

export async function getCheckpointer(): Promise<PostgresSaver> {
  if (globalForCheckpointer.agentCheckpointer) {
    return globalForCheckpointer.agentCheckpointer;
  }

  if (!globalForCheckpointer.agentCheckpointerReady) {
    globalForCheckpointer.agentCheckpointerReady = (async () => {
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error("DATABASE_URL is required for the agent checkpointer");
      }

      const checkpointer = PostgresSaver.fromConnString(databaseUrl);
      await checkpointer.setup();
      globalForCheckpointer.agentCheckpointer = checkpointer;
      return checkpointer;
    })().catch((error) => {
      globalForCheckpointer.agentCheckpointerReady = undefined;
      throw error;
    });
  }

  return globalForCheckpointer.agentCheckpointerReady;
}
