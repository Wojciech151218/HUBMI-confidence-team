"use server";

import { Initiative } from "@/db/initiative";
import { getDataSource } from "@/lib/data-source";

export type AdminInitiative = {
  id: number;
  title: string;
  description: string;
  location: string | null;
  contactEmail: string;
  votes: number;
  createdAt: string;
};

type AdminInitiativeRow = Omit<AdminInitiative, "votes" | "createdAt"> & {
  votes: string;
  createdAt: Date;
};

// The admin panel is intentionally open: no login or admin check.
export async function listAdminInitiatives(): Promise<AdminInitiative[]> {
  const dataSource = await getDataSource();
  const rows = await dataSource
    .getRepository(Initiative)
    .createQueryBuilder("initiative")
    .leftJoin("initiative.votes", "vote")
    .select("initiative.id", "id")
    .addSelect("initiative.title", "title")
    .addSelect("initiative.description", "description")
    .addSelect("initiative.location", "location")
    .addSelect("initiative.contact_email", "contactEmail")
    .addSelect("COUNT(vote.id)", "votes")
    .addSelect("initiative.created_at", "createdAt")
    .groupBy("initiative.id")
    .orderBy("initiative.created_at", "DESC")
    .getRawMany<AdminInitiativeRow>();

  return rows.map((row) => ({
    ...row,
    votes: Number(row.votes),
    createdAt: new Date(row.createdAt).toISOString(),
  }));
}

// Votes are removed by the ON DELETE CASCADE on initiative_votes.
export async function deleteInitiative(initiativeId: number) {
  if (!Number.isInteger(initiativeId)) {
    throw new Error("deleteInitiative: invalid initiative");
  }
  const dataSource = await getDataSource();
  await dataSource.getRepository(Initiative).delete(initiativeId);
  return listAdminInitiatives();
}
