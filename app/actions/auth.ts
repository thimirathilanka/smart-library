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
import { safeCallbackPath } from "@/lib/safe-callback";
import type { ResourceKind } from "@/lib/types";

const NAME_MAX = 80;

function isEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isResourceId(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 80 && !value.includes("\0");
}

function isResourceKind(value: unknown): value is ResourceKind {
  return value === "book" || value === "paper";
}

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
  const callbackUrl = safeCallbackPath(String(formData.get("callbackUrl") ?? "/"));
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

  if (!firstName || !lastName || firstName.length > NAME_MAX || lastName.length > NAME_MAX) {
    return {
      error: "First and last name are required and must be 80 characters or fewer.",
      values,
    };
  }

  if (!isEmail(email) || password.length < 8) {
    return {
      error: "Enter a valid email and a password of at least 8 characters.",
      values,
    };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match.", values };
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
  if (!isResourceKind(kind) || !isResourceId(id)) return;
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
  if ((list !== "saved" && list !== "favorites") || !isResourceId(resourceId) || !isResourceKind(kind)) return;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  await toggleLibraryList(session.user.id, list, resourceId, kind);
  revalidatePath("/library");
  revalidatePath(kind === "book" ? `/books/${resourceId}` : `/research/${resourceId}`);
}
