import { NextResponse } from "next/server";
import { User } from "@/db/user";
import { getDataSource } from "@/lib/data-source";
import { toPublicUser } from "@/lib/user-public";

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const username = body.username?.trim();
  const password = body.password;

  if (!username || !password) {
    return NextResponse.json(
      { error: "username and password are required" },
      { status: 400 },
    );
  }

  const ds = await getDataSource();
  const repo = ds.getRepository(User);
  const user = await repo.findOne({ where: { username } });

  if (!user || user.passwordHash !== password) {
    console.log("users POST login: failed", username);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  console.log("users POST login:", user.username, user.id);
  return NextResponse.json(toPublicUser(user));
}
