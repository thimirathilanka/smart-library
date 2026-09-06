"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";
import { createBook, incrementBookReads } from "@/lib/data/books";
import { incrementMonthlyReads } from "@/lib/data/catalog";
import { createMember, getMemberByEmail, recordReading, toggleLibraryList } from "@/lib/data/members";
import { createPaper, incrementPaperReads } from "@/lib/data/papers";
import type { AccessType, ResourceKind } from "@/lib/types";

export type AuthState = { error?: string; success?: string };

function staff(isAdmin?: boolean) {
  return Boolean(isAdmin);
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/") || "/";
  try {
    await signIn("credentials", { email, password, redirectTo: callbackUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
  return {};
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 8) {
    return { error: "Name, email, and a password of at least 8 characters are required." };
  }

  const existing = await getMemberByEmail(email);
  if (existing) return { error: "An account with that email already exists." };

  await createMember({
    _id: `u-${crypto.randomUUID()}`,
    name,
    email,
    plan: "free",
    isAdmin: false,
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
      return { error: "Account created. Please sign in." };
    }
    throw error;
  }
  return {};
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

const covers = [
  { from: "#0B1F3A", to: "#1B4F8A", accent: "#C9A227" },
  { from: "#1A2F23", to: "#3D6B4F", accent: "#E8D5A3" },
  { from: "#1B1B3A", to: "#4C3A8C", accent: "#7EE0C8" },
  { from: "#121C33", to: "#2C4A7A", accent: "#C9B037" },
];

function slugId(prefix: string, title: string) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36);
  return `${prefix}-${slug || "item"}-${Date.now().toString(36)}`;
}

export async function createResourceAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const session = await auth();
  if (!staff(session?.user?.isAdmin)) return { error: "You do not have permission to add resources." };

  const kind = String(formData.get("kind") ?? "book");
  const title = String(formData.get("title") ?? "").trim();
  const year = Number(formData.get("year") ?? new Date().getFullYear());
  const access = String(formData.get("access") ?? "open") === "members" ? "members" : "open";
  const description = String(formData.get("description") ?? "").trim();
  if (!title) return { error: "Title is required." };

  if (kind === "paper") {
    const authors = String(formData.get("authors") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    await createPaper({
      _id: slugId("p", title),
      title,
      authors: authors.length ? authors : ["Unknown"],
      abstract: description || "Abstract forthcoming.",
      keywords: ["catalog"],
      field: String(formData.get("field") ?? "Humanities"),
      year: Number.isFinite(year) ? year : new Date().getFullYear(),
      publishedAt: new Date().toISOString().slice(0, 10),
      venue: "Nextgen Digital Library",
      venueType: "journal",
      citations: 0,
      pages: "1–12",
      doi: String(formData.get("doi") ?? `10.0000/${Date.now()}`),
      access: access as AccessType,
      addedAt: new Date().toISOString().slice(0, 10),
      reads: 0,
    });
    revalidatePath("/research");
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: "Paper added to the catalog." };
  }

  await createBook({
    _id: slugId("b", title),
    title,
    author: String(formData.get("author") ?? "Unknown").trim() || "Unknown",
    category: String(formData.get("category") ?? "Humanities"),
    year: Number.isFinite(year) ? year : new Date().getFullYear(),
    publisher: "Nextgen Digital Library",
    isbn: String(formData.get("isbn") ?? "000-0-000-00000-0"),
    pages: 240,
    language: "English",
    access: access as AccessType,
    rating: 0,
    ratingsCount: 0,
    description: description || "Description forthcoming.",
    cover: covers[Math.floor(Math.random() * covers.length)]!,
    addedAt: new Date().toISOString().slice(0, 10),
    reads: 0,
    featured: false,
  });
  revalidatePath("/books");
  revalidatePath("/admin");
  revalidatePath("/");
  return { success: "Book added to the catalog." };
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
