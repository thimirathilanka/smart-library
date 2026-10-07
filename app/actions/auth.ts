"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";
import { incrementBookReads } from "@/lib/data/books";
import { incrementMonthlyReads } from "@/lib/data/catalog";
import { createMember, getMemberByEmail, recordReading, toggleLibraryList } from "@/lib/data/members";
import { incrementPaperReads } from "@/lib/data/papers";
import type { ResourceKind } from "@/lib/types";

export type AuthState = {
  error?: string;
  success?: string;
  values?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    accountType?: "reader" | "author";
  };
};

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/") || "/";
  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password.", values: { email } };
    }
    throw error;
  }
  return {};
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const accountType: "reader" | "author" =
    String(formData.get("accountType") ?? "reader") === "author" ? "author" : "reader";
  const values = { firstName, lastName, email, accountType };
  const name = `${firstName} ${lastName}`.replace(/\s+/g, " ").trim();

  if (!firstName || !lastName || !email || password.length < 8) {
    return {
      error: "First name, last name, email, and a password of at least 8 characters are required.",
      values,
    };
  }

  if (password !== confirmPassword) {
    return {
      error: "Passwords do not match.",
      values: { ...values, password, confirmPassword },
    };
  }

  const existing = await getMemberByEmail(email);
  if (existing) {
    return { error: "An account with that email already exists.", values };
  }

  await createMember({
    _id: `u-${crypto.randomUUID()}`,
    name,
    email,
    isMember: false,
    isAdmin: false,
    isAuthor: accountType === "author",
    joinedAt: new Date().toISOString().slice(0, 10),
    reads: 0,
    status: "Active",
    passwordHash: await hash(password, 10),
    library: { saved: [], history: [], favorites: [] },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created. Please sign in.", values };
    }
    throw error;
  }
  return {};
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function trackReadAction(kind: ResourceKind, id: string) {
  if (kind === "book") await incrementBookReads(id);
  else await incrementPaperReads(id);
  await incrementMonthlyReads(kind === "book" ? "books" : "papers");

  const session = await auth();
  if (session?.user?.id) {
    await recordReading(session.user.id, id, kind);
    revalidatePath("/library");
  }
}

export async function toggleLibraryAction(list: "saved" | "favorites", resourceId: string, kind: ResourceKind) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  await toggleLibraryList(session.user.id, list, resourceId, kind);
  revalidatePath("/library");
  revalidatePath(kind === "book" ? `/books/${resourceId}` : `/research/${resourceId}`);
}
