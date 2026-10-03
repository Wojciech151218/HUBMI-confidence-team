"use server";

import { Initiative } from "@/db/initiative";
import { InitiativeVote } from "@/db/initiative-vote";
import { getDataSource } from "@/lib/data-source";

export type InitiativeListItem = {
  id: number;
  title: string;
  description: string;
  location: string | null;
  votes: number;
  voted: boolean;
};

type InitiativeRow = {
  id: number;
  title: string;
  description: string;
  location: string | null;
  votes: string;
  voted: boolean | null;
};

function toUserId(value: number | null) {
  return value !== null && Number.isInteger(value) && value > 0 ? value : null;
}

export async function listInitiatives(userId: number | null): Promise<InitiativeListItem[]> {
  const dataSource = await getDataSource();
  const rows = await dataSource
    .getRepository(Initiative)
    .createQueryBuilder("initiative")
    .leftJoin("initiative.votes", "vote")
    .select("initiative.id", "id")
    .addSelect("initiative.title", "title")
    .addSelect("initiative.description", "description")
    .addSelect("initiative.location", "location")
    .addSelect("COUNT(vote.id)", "votes")
    .addSelect("BOOL_OR(vote.user_id = :userId)", "voted")
    .setParameter("userId", toUserId(userId))
    .groupBy("initiative.id")
    .orderBy("COUNT(vote.id)", "DESC")
    .addOrderBy("initiative.created_at", "DESC")
    .getRawMany<InitiativeRow>();

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    location: row.location,
    votes: Number(row.votes),
    voted: row.voted === true,
  }));
}

// One vote per user: clicking again takes the vote back.
export async function toggleVote(
  initiativeId: number,
  userId: number,
): Promise<InitiativeListItem[]> {
  const voterId = toUserId(userId);
  if (voterId === null || !Number.isInteger(initiativeId)) {
    throw new Error("toggleVote: invalid initiative or user");
  }

  const dataSource = await getDataSource();
  const votes = dataSource.getRepository(InitiativeVote);
  const existing = await votes.findOneBy({ initiativeId, userId: voterId });
  if (existing) {
    await votes.delete(existing.id);
  } else {
    await votes.insert({ initiativeId, userId: voterId });
  }

  return listInitiatives(voterId);
}
