import "reflect-metadata";
import { DataSource } from "typeorm";
import { Document } from "../db/document";
import { User } from "../db/user";

const globalForDataSource = globalThis as unknown as {
  dataSource?: DataSource;
};

export const AppDataSource =
  globalForDataSource.dataSource ??
  new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [Document, User],
    synchronize: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDataSource.dataSource = AppDataSource;
}

export async function getDataSource() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  return AppDataSource;
}
