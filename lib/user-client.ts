import type { PublicUser } from "@/lib/user-public";

export type { PublicUser };

export type RegisterInput = {
  email: string;
  username: string;
  password: string;
};

export type LoginInput = {
  username: string;
  password: string;
};

export type GetUserParams = {
  id?: number;
  username?: string;
};

class UserClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "UserClientError";
    this.status = status;
  }
}

async function parseError(response: Response): Promise<never> {
  let message = response.statusText;
  try {
    const data = (await response.json()) as { error?: string };
    if (data.error) {
      message = data.error;
    }
  } catch {
    // keep statusText
  }
  throw new UserClientError(message, response.status);
}

export async function register(input: RegisterInput): Promise<PublicUser> {
  const response = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    await parseError(response);
  }
  return response.json();
}

export async function login(input: LoginInput): Promise<PublicUser> {
  const response = await fetch("/api/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    await parseError(response);
  }
  return response.json();
}

export async function getUser(params: GetUserParams): Promise<PublicUser> {
  const search = new URLSearchParams();
  if (params.id !== undefined) {
    search.set("id", String(params.id));
  } else if (params.username) {
    search.set("username", params.username);
  } else {
    throw new UserClientError("Provide id or username", 400);
  }

  const response = await fetch(`/api/users?${search.toString()}`);
  if (!response.ok) {
    await parseError(response);
  }
  return response.json();
}
