export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("reflect-metadata");

    // Sync md-database/*.md into the knowledge base; a failure must not stop the app booting.
    try {
      const { seedDocuments } = await import("@/lib/seed-documents");
      await seedDocuments();
    } catch (error) {
      console.error("[seed] failed to sync md-database:", error);
    }
  }
}
