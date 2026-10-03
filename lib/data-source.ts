import "reflect-metadata";
import { DataSource } from "typeorm";
import { Category } from "../db/category";
import { Document } from "../db/document";
import { Initiative } from "../db/initiative";
import { User } from "../db/user";

const entities = [Document, Category, User, Initiative];

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
function isStale(ds: DataSource) {
  return ds.isInitialized && !entities.every((entity) => ds.hasMetadata(entity));
}

export async function getDataSource() {
  if (isStale(AppDataSource)) {
    await AppDataSource.destroy();
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
