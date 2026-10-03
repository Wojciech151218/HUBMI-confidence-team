import "reflect-metadata";
import { DataSource } from "typeorm";
import { Category } from "../db/category";
import { Document } from "../db/document";
import { Initiative } from "../db/initiative";
import { InitiativeVote } from "../db/initiative-vote";
import { User } from "../db/user";

const entities = [Document, Category, User, Initiative, InitiativeVote];

const globalForDataSource = globalThis as unknown as {
  dataSource?: DataSource;
};

function createDataSource() {
  return new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities,
    synchronize: true,
  });
}

export let AppDataSource = globalForDataSource.dataSource ?? createDataSource();

if (process.env.NODE_ENV !== "production") {
  globalForDataSource.dataSource = AppDataSource;
}

// Dev hot reload re-evaluates entity modules, so a DataSource cached on globalThis
// can hold stale class references ("No metadata for User"). Rebuild it when that happens.
// An uninitialized one may come from a reload whose entities failed to build, so rebuild it too.
function isStale(ds: DataSource) {
  return !ds.isInitialized || !entities.every((entity) => ds.hasMetadata(entity));
}

export async function getDataSource() {
  if (isStale(AppDataSource)) {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    AppDataSource = createDataSource();
    if (process.env.NODE_ENV !== "production") {
      globalForDataSource.dataSource = AppDataSource;
    }
  }

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  return AppDataSource;
}
