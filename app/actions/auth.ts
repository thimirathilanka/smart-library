"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";
import { getBook } from "@/lib/data/books";
import {
  createMember,
  getMemberByEmail,
  getMemberById,
  hasActiveMembership,
  isActiveAccount,
  recordReading,
  requireActiveAccount,
  toggleLibraryList,
} from "@/lib/data/members";
import { getPaper } from "@/lib/data/papers";
import { recordActivity } from "@/lib/data/activity";
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

  const memberId = `u-${crypto.randomUUID()}`;
  await createMember({
    _id: memberId,
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
  await recordActivity({ actorId: memberId, action: "auth.registered", detail: `Registered as ${accountType}` });

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
  const session = await auth();
  await recordActivity({ actorId: session?.user?.id ?? null, action: "auth.signed_out", detail: "Signed out" });
  await signOut({ redirectTo: "/" });
}

export async function trackReadAction(kind: ResourceKind, id: string) {
  if (!isResourceKind(kind) || !isResourceId(id)) return;

  const resource = kind === "book" ? await getBook(id) : await getPaper(id);
  if (!resource) return;

  const session = await auth();
  const member = session?.user?.id ? await getMemberById(session.user.id) : null;
  if (member && !isActiveAccount(member)) return;

  if (resource.access === "members") {
    const isAdmin = Boolean(member && isActiveAccount(member) && member.isAdmin);
    if (!isAdmin && !hasActiveMembership(member)) return;
  }

  // Read counts and activity are recorded on successful file open. TrackRead only keeps library history.
  if (session?.user?.id && isActiveAccount(member)) {
    await recordReading(session.user.id, id, kind);
    revalidatePath("/library");
  }
}

export async function toggleLibraryAction(list: "saved" | "favorites", resourceId: string, kind: ResourceKind) {
  if ((list !== "saved" && list !== "favorites") || !isResourceId(resourceId) || !isResourceKind(kind)) return;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const member = await requireActiveAccount(session.user.id);
  if (!member) return;
  const result = await toggleLibraryList(session.user.id, list, resourceId, kind);
  const verb = list === "saved" ? (result.added ? "saved" : "removed from saved") : (result.added ? "favorited" : "removed from favorites");
  await recordActivity({
    actorId: session.user.id,
    action: `library.${list}_${result.added ? "added" : "removed"}`,
    targetKind: kind,
    targetId: resourceId,
    detail: `${kind} ${verb}`,
  });
  revalidatePath("/library");
  revalidatePath(kind === "book" ? `/books/${resourceId}` : `/research/${resourceId}`);
}
