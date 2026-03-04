"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/be/auth/get-user";

export async function signUp(input: {
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: undefined,
    },
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function signIn(input: {
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function signOut(): Promise<{ success: boolean }> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { success: true };
}

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUser() {
  return getCurrentUser();
}
