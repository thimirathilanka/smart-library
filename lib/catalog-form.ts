import type { AccessType, Book, PublicationStatus, ResearchPaper } from "@/lib/types";

const covers = [
  { from: "#0B1F3A", to: "#1B4F8A", accent: "#C9A227" },
  { from: "#1A2F23", to: "#3D6B4F", accent: "#E8D5A3" },
  { from: "#1B1B3A", to: "#4C3A8C", accent: "#7EE0C8" },
  { from: "#121C33", to: "#2C4A7A", accent: "#C9B037" },
];

function slugId(prefix: string, title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36);
  return `${prefix}-${slug || "item"}-${Date.now().toString(36)}`;
}

function accessOf(value: FormDataEntryValue | null): AccessType {
  return String(value ?? "open") === "members" ? "members" : "open";
}

function yearOf(value: FormDataEntryValue | null) {
  const year = Number(value ?? new Date().getFullYear());
  return Number.isFinite(year) ? year : new Date().getFullYear();
}

export type BookEdits = Pick<
  Book,
  "title" | "author" | "category" | "year" | "isbn" | "access" | "description"
>;

export type PaperEdits = Pick<
  ResearchPaper,
  "title" | "authors" | "abstract" | "field" | "year" | "doi" | "access"
>;

export function editsFromForm(
  formData: FormData,
):
  | { ok: true; kind: "book"; edits: BookEdits }
  | { ok: true; kind: "paper"; edits: PaperEdits }
  | { ok: false; error: string } {
  const kind = String(formData.get("kind") ?? "book");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const year = yearOf(formData.get("year"));
  const access = accessOf(formData.get("access"));
  if (!title) return { ok: false, error: "Title is required." };

  if (kind === "paper") {
    const authors = String(formData.get("authors") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    return {
      ok: true,
      kind: "paper",
      edits: {
        title,
        authors: authors.length ? authors : ["Unknown"],
        abstract: description || "Abstract forthcoming.",
        field: String(formData.get("field") ?? "Humanities"),
        year,
        doi: String(formData.get("doi") ?? `10.0000/${Date.now()}`),
        access,
      },
    };
  }

  if (kind !== "book") return { ok: false, error: "Choose a book or a paper." };

  return {
    ok: true,
    kind: "book",
    edits: {
      title,
      author: String(formData.get("author") ?? "Unknown").trim() || "Unknown",
      category: String(formData.get("category") ?? "Humanities"),
      year,
      isbn: String(formData.get("isbn") ?? "000-0-000-00000-0"),
      access,
      description: description || "Description forthcoming.",
    },
  };
}

export function draftFromForm(
  formData: FormData,
  options: {
    submittedBy: string;
    publicationStatus: Extract<PublicationStatus, "pending" | "published">;
  },
):
  | { ok: true; kind: "book"; book: Book }
  | { ok: true; kind: "paper"; paper: ResearchPaper }
  | { ok: false; error: string } {
  const parsed = editsFromForm(formData);
  if (!parsed.ok) return parsed;
  const addedAt = new Date().toISOString().slice(0, 10);

  if (parsed.kind === "paper") {
    return {
      ok: true,
      kind: "paper",
      paper: {
        _id: slugId("p", parsed.edits.title),
        ...parsed.edits,
        keywords: ["catalog"],
        publishedAt: addedAt,
        venue: "Nextgen Digital Library",
        venueType: "journal",
        citations: 0,
        pages: "1–12",
        addedAt,
        reads: 0,
        submittedBy: options.submittedBy,
        publicationStatus: options.publicationStatus,
      },
    };
  }

  return {
    ok: true,
    kind: "book",
    book: {
      _id: slugId("b", parsed.edits.title),
      ...parsed.edits,
      publisher: "Nextgen Digital Library",
      pages: 240,
      language: "English",
      rating: 0,
      ratingsCount: 0,
      cover: covers[Math.floor(Math.random() * covers.length)]!,
      addedAt,
      reads: 0,
      featured: false,
      submittedBy: options.submittedBy,
      publicationStatus: options.publicationStatus,
    },
  };
}
