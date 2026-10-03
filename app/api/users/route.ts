import { NextResponse } from "next/server";
import { QueryFailedError } from "typeorm";
import { User } from "@/db/user";
import { getDataSource } from "@/lib/data-source";
import { toPublicUser } from "@/lib/user-public";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get("id");
  const username = searchParams.get("username");

  if (!idParam && !username) {
    return NextResponse.json(
      { error: "Provide id or username" },
      { status: 400 },
    );
  }

  const ds = await getDataSource();
  const repo = ds.getRepository(User);

  const where = idParam
    ? { id: Number(idParam) }
    : { username: username! };

  if (idParam && Number.isNaN(where.id as number)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const user = await repo.findOne({ where });

  if (!user) {
    console.log("users GET: not found", idParam ?? username);
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  console.log("users GET:", user.username, user.id);
  return NextResponse.json(toPublicUser(user));
}

export async function POST(request: Request) {
  let body: { email?: string; username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim();
  const username = body.username?.trim();
  const password = body.password;

  if (!email || !username || !password) {
    return NextResponse.json(
      { error: "email, username, and password are required" },
      { status: 400 },
    );
  }

  const ds = await getDataSource();
  const repo = ds.getRepository(User);

  try {
    const user = repo.create({
      email,
      username,
      passwordHash: password,
    });
    await repo.save(user);
    console.log("users POST register:", user.username, user.id);
    return NextResponse.json(toPublicUser(user), { status: 201 });
  } catch (error) {
    if (error instanceof QueryFailedError) {
      console.log("users POST register: conflict", username);
      return NextResponse.json(
        { error: "email or username already taken" },
        { status: 409 },
      );
    }
    throw error;
  }
}
