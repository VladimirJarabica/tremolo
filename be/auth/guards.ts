import type { Selectable } from "kysely";
import { User } from "../db/types";
import { AuthError, AuthErrorCode } from "./auth-error";
import { getCurrentUser } from "./get-user";

type UserContext = {
  user: Selectable<User>;
};

export async function getUserContext(): Promise<UserContext> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError(AuthErrorCode.AUTH_NOT_AUTHENTICATED);
  }

  return { user };
}

export async function getSafeUserContext(): Promise<UserContext | null> {
  try {
    return await getUserContext();
  } catch {
    return null;
  }
}
