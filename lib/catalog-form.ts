import type { AccessType, Book, PublicationStatus, ResearchPaper } from "@/lib/types";

const covers = [
  { from: "#0B1F3A", to: "#1B4F8A", accent: "#C9A227" },
  { from: "#1A2F23", to: "#3D6B4F", accent: "#E8D5A3" },
  { from: "#1B1B3A", to: "#4C3A8C", accent: "#7EE0C8" },
  { from: "#121C33", to: "#2C4A7A", accent: "#C9B037" },
];

const TITLE_MAX = 200;
const AUTHOR_MAX = 120;
const DESCRIPTION_MAX = 4000;
const LABEL_MAX = 80;
const PUBLISHER_MAX = 120;
const VENUE_MAX = 200;
const LANGUAGE_MAX = 80;
const PAGES_LABEL_MAX = 40;
const ISBN_MAX = 32;
const DOI_MAX = 200;
const AUTHOR_COUNT_MAX = 20;
const KEYWORD_COUNT_MAX = 20;

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

function yearOf(value: FormDataEntryValue | null): { ok: true; year: number } | { ok: false; error: string } {
  const raw = String(value ?? "").trim();
  if (!/^\d{4}$/.test(raw)) return { ok: false, error: "Enter a four-digit publication year." };
  const year = Number(raw);
  const max = new Date().getFullYear() + 1;
  if (year < 1000 || year > max) return { ok: false, error: `Year must be between 1000 and ${max}.` };
  return { ok: true, year };
}

function limited(
  value: string,
  max: number,
  label: string,
): { ok: true; value: string } | { ok: false; error: string } {
  const text = value.trim();
  if (text.length > max) return { ok: false, error: `${label} must be ${max} characters or fewer.` };
  return { ok: true, value: text };
}

function isbnOf(value: string): { ok: true; isbn: string } | { ok: false; error: string } {
  const isbn = value.trim();
  if (!isbn) return { ok: true, isbn: "" };
  if (isbn.length > ISBN_MAX) return { ok: false, error: `ISBN must be ${ISBN_MAX} characters or fewer.` };
  const compact = isbn.replace(/[-\s]/g, "");
  if (!/^(?:\d{9}[\dXx]|\d{13})$/.test(compact)) {
    return { ok: false, error: "Enter a valid ISBN, or leave it blank." };
  }
  return { ok: true, isbn };
}

function doiOf(value: string): { ok: true; doi: string } | { ok: false; error: string } {
  const doi = value.trim();
  if (!doi) return { ok: true, doi: "" };
  if (doi.length > DOI_MAX) return { ok: false, error: `DOI must be ${DOI_MAX} characters or fewer.` };
  if (!/^10\.\d{4,9}\/\S+$/.test(doi)) {
    return { ok: false, error: "Enter a valid DOI, or leave it blank." };
  }
  return { ok: true, doi };
}

function bookPagesOf(value: FormDataEntryValue | null): { ok: true; pages: number } | { ok: false; error: string } {
  const raw = String(value ?? "").trim();
  if (!/^\d+$/.test(raw)) return { ok: false, error: "Enter the page count as a whole number." };
  const pages = Number(raw);
  if (pages < 1 || pages > 100_000) return { ok: false, error: "Page count must be between 1 and 100000." };
  return { ok: true, pages };
}

function paperPagesOf(value: FormDataEntryValue | null): { ok: true; pages: string } | { ok: false; error: string } {
  const pages = limited(String(value ?? ""), PAGES_LABEL_MAX, "Page range");
  if (!pages.ok) return pages;
  if (!pages.value) return { ok: false, error: "Page range is required." };
  return { ok: true, pages: pages.value };
}

function keywordsOf(value: FormDataEntryValue | null): { ok: true; keywords: string[] } | { ok: false; error: string } {
  const field = limited(String(value ?? ""), 2000, "Keywords");
  if (!field.ok) return field;
  const keywords = field.value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!keywords.length) return { ok: false, error: "Enter at least one keyword." };
  if (keywords.length > KEYWORD_COUNT_MAX) {
    return { ok: false, error: `Enter ${KEYWORD_COUNT_MAX} keywords or fewer.` };
  }
  if (keywords.some((keyword) => keyword.length > LABEL_MAX)) {
    return { ok: false, error: `Each keyword must be ${LABEL_MAX} characters or fewer.` };
  }
  return { ok: true, keywords };
}

export type BookEdits = Pick<
  Book,
  "title" | "author" | "category" | "year" | "isbn" | "publisher" | "pages" | "language" | "access" | "description"
>;

export type PaperEdits = Pick<
  ResearchPaper,
  "title" | "authors" | "abstract" | "field" | "year" | "doi" | "venue" | "pages" | "keywords" | "access"
>;

export function editsFromForm(
  formData: FormData,
):
  | { ok: true; kind: "book"; edits: BookEdits }
  | { ok: true; kind: "paper"; edits: PaperEdits }
  | { ok: false; error: string } {
  const kind = String(formData.get("kind") ?? "book");
  const title = limited(String(formData.get("title") ?? ""), TITLE_MAX, "Title");
  if (!title.ok) return title;
  if (!title.value) return { ok: false, error: "Title is required." };

  const description = limited(String(formData.get("description") ?? ""), DESCRIPTION_MAX, "Description");
  if (!description.ok) return description;
  if (!description.value) return { ok: false, error: "Description is required." };

  const year = yearOf(formData.get("year"));
  if (!year.ok) return year;
  const access = accessOf(formData.get("access"));

  if (kind === "paper") {
    const authorsField = limited(String(formData.get("authors") ?? ""), 3000, "Authors");
    if (!authorsField.ok) return authorsField;
    const authors = authorsField.value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (!authors.length) return { ok: false, error: "At least one author is required." };
    if (authors.length > AUTHOR_COUNT_MAX) {
      return { ok: false, error: `Enter ${AUTHOR_COUNT_MAX} authors or fewer.` };
    }
    if (authors.some((author) => author.length > AUTHOR_MAX)) {
      return { ok: false, error: `Each author must be ${AUTHOR_MAX} characters or fewer.` };
    }

    const field = limited(String(formData.get("field") ?? ""), LABEL_MAX, "Research field");
    if (!field.ok) return field;
    if (!field.value) return { ok: false, error: "Research field is required." };

    const venue = limited(String(formData.get("venue") ?? ""), VENUE_MAX, "Venue");
    if (!venue.ok) return venue;
    if (!venue.value) return { ok: false, error: "Venue is required." };

    const pages = paperPagesOf(formData.get("pages"));
    if (!pages.ok) return pages;

    const keywords = keywordsOf(formData.get("keywords"));
    if (!keywords.ok) return keywords;

    const doi = doiOf(String(formData.get("doi") ?? ""));
    if (!doi.ok) return doi;

    return {
      ok: true,
      kind: "paper",
      edits: {
        title: title.value,
        authors,
        abstract: description.value,
        field: field.value,
        year: year.year,
        doi: doi.doi,
        venue: venue.value,
        pages: pages.pages,
        keywords: keywords.keywords,
        access,
      },
    };
  }

  if (kind !== "book") return { ok: false, error: "Choose a book or a paper." };

  const author = limited(String(formData.get("author") ?? ""), AUTHOR_MAX, "Author");
  if (!author.ok) return author;
  if (!author.value) return { ok: false, error: "Author is required." };

  const category = limited(String(formData.get("category") ?? ""), LABEL_MAX, "Category");
  if (!category.ok) return category;
  if (!category.value) return { ok: false, error: "Category is required." };

  const publisher = limited(String(formData.get("publisher") ?? ""), PUBLISHER_MAX, "Publisher");
  if (!publisher.ok) return publisher;
  if (!publisher.value) return { ok: false, error: "Publisher is required." };

  const language = limited(String(formData.get("language") ?? ""), LANGUAGE_MAX, "Language");
  if (!language.ok) return language;
  if (!language.value) return { ok: false, error: "Language is required." };

  const pages = bookPagesOf(formData.get("pages"));
  if (!pages.ok) return pages;

  const isbn = isbnOf(String(formData.get("isbn") ?? ""));
  if (!isbn.ok) return isbn;

  return {
    ok: true,
    kind: "book",
    edits: {
      title: title.value,
      author: author.value,
      category: category.value,
      year: year.year,
      isbn: isbn.isbn,
      publisher: publisher.value,
      pages: pages.pages,
      language: language.value,
      access,
      description: description.value,
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
        publishedAt: addedAt,
        venueType: "journal",
        citations: 0,
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
