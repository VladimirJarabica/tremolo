import { getAuthUser } from "@/lib/supabase/auth";
import { db } from "../db";

export const getUserByAuthId = async (authId: string | null) => {
  if (!authId) {
    return null;
  }

  return (
    (await db
      .selectFrom("User")
      .selectAll()
      .where("authId", "=", authId)
      .executeTakeFirst()) ?? null
  );
};

const linkInvitedUser = async (authId: string, email?: string) => {
  if (!email) {
    return null;
  }
  const invitedUser = await db
    .selectFrom("User")
    .selectAll()
    .where("User.email", "=", email.toLowerCase().trim())
    .where("User.deletedAt", "is", null)
    .executeTakeFirst();

  if (invitedUser === undefined) {
    return null;
  }

  await db
    .updateTable("User")
    .set({ authId })
    .where("User.id", "=", invitedUser.id)
    .execute();

  return { ...invitedUser, authId };
};

const createUserFromAuthUser = async (
  authId: string,
  email?: string,
  userName?: string,
) => {
  if (!email) {
    return null;
  }
  try {
    const result = await db
      .insertInto("User")
      .values({
        authId,
        email: email.toLowerCase().trim(),
      })
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      return null;
    }
    return result;
  } catch {
    const raceConditionUser = await db
      .selectFrom("User")
      .selectAll()
      .where("authId", "=", authId)
      .executeTakeFirst();
    return raceConditionUser;
  }
};

// TODO: redis
export const getCurrentUser = async () => {
  const authUser = await getAuthUser();

  if (!authUser) {
    return null;
  }

  const user = await getUserByAuthId(authUser.id);

  if (user) {
    return user;
  }
  // User has a Supabase account but no linked DB record — check for invited user
  const invitedUser = await linkInvitedUser(authUser.id, authUser.email);
  if (invitedUser) {
    return invitedUser;
  }

  const createdUser = await createUserFromAuthUser(
    authUser.id,
    authUser.email,
    authUser.user_metadata?.userName as string | undefined,
  );

  if (createdUser) {
    return createdUser;
  }

  return null;
};

export type User = Exclude<Awaited<ReturnType<typeof getUserByAuthId>>, null>;
