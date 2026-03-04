import type { Selectable } from "kysely";
import { db } from "../db";
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

export async function requireUser(id: string) {
  const userContext = await getUserContext();

  if (userContext.user.id !== id) {
    throw new AuthError(AuthErrorCode.AUTH_NOT_AUTHORIZED);
  }

  return userContext;
}

export async function requireSheetOwnership(sheetId: string) {
  const userContext = await getUserContext();

  const sheet = await db
    .selectFrom("Sheet")
    .select(["id", "userId"])
    .where("id", "=", sheetId)
    .executeTakeFirst();

  if (!sheet || sheet.userId !== userContext.user.id) {
    throw new AuthError(AuthErrorCode.AUTH_NOT_AUTHORIZED);
  }

  return userContext;
}
