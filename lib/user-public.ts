import type { User } from "@/db/user";

export type PublicUser = {
  id: number;
  email: string;
  username: string;
};

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
  };
}
