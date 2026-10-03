import "reflect-metadata";
import { DataSource } from "typeorm";
import { embeddingDimensions } from "./openai";
import { Document } from "./document";

const globalForDataSource = globalThis as unknown as {
  dataSource?: DataSource;
};

export const AppDataSource =
  globalForDataSource.dataSource ??
  new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [Document],
    synchronize: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDataSource.dataSource = AppDataSource;
}

async function ensureSchema(dataSource: DataSource) {
  await dataSource.query("CREATE EXTENSION IF NOT EXISTS vector");
  await dataSource.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      body text NOT NULL,
      embedding vector(${embeddingDimensions}),
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

export async function getDataSource() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    await ensureSchema(AppDataSource);
  }

  return AppDataSource;
}
