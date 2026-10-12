import "server-only";

import { collections, deleteGridFsFile, discardGridFsFiles } from "@/lib/db";
import { toPlain } from "@/lib/data/serialize";
import { withPublished } from "@/lib/data/publication";
import type { BookEdits } from "@/lib/catalog-form";
import type { Book, BookRevision } from "@/lib/types";

export async function listBooks() {
  const { books } = await collections();
  return toPlain(await books.find(withPublished<Book>({})).sort({ addedAt: -1 }).toArray());
}

export async function listAllBooks() {
  const { books } = await collections();
  return toPlain(await books.find().sort({ addedAt: -1 }).toArray());
}

export async function listBooksByAuthor(memberId: string) {
  const { books } = await collections();
  return toPlain(await books.find({ submittedBy: memberId }).sort({ addedAt: -1 }).toArray());
}

export async function getBook(id: string) {
  const { books } = await collections();
  const book = await books.findOne(withPublished<Book>({ _id: id }));
  return book ? toPlain(book) : null;
}

export async function getBookForStaff(id: string) {
  const { books } = await collections();
  const book = await books.findOne({ _id: id });
  return book ? toPlain(book) : null;
}

export async function featuredBooks() {
  const { books } = await collections();
  return toPlain(
    await books.find(withPublished<Book>({ featured: true })).sort({ reads: -1 }).toArray(),
  );
}

export async function relatedBooks(book: Book, limit = 4) {
  const { books } = await collections();
  const sameCategory = await books
    .find(withPublished<Book>({ _id: { $ne: book._id }, category: book.category }))
    .limit(limit)
    .toArray();
  if (sameCategory.length >= limit) return toPlain(sameCategory);
  const sameAuthor = await books
    .find(
      withPublished<Book>({
        _id: { $nin: [book._id, ...sameCategory.map((item) => item._id)] },
        author: book.author,
      }),
    )
    .limit(limit - sameCategory.length)
    .toArray();
  return toPlain([...sameCategory, ...sameAuthor]);
}

export async function createBook(book: Book) {
  const { books } = await collections();
  await books.insertOne(book);
}

export async function updateBook(
  id: string,
  edits: BookEdits,
  publicationStatus: NonNullable<Book["publicationStatus"]>,
  fileId?: string,
  coverId?: string,
) {
  const { books } = await collections();
  const existing = await books.findOne({ _id: id });
  if (!existing) return false;
  const result = await books.updateOne(
    { _id: id },
    {
      $set: {
        ...edits,
        publicationStatus,
        ...(fileId ? { fileId } : {}),
        ...(coverId ? { coverId } : {}),
      },
      $unset: { reviewNote: "" },
    },
  );
  if (result.matchedCount === 0) return false;
  await removeReplacedFile(existing.fileId, fileId);
  await removeReplacedFile(existing.coverId, coverId);
  return true;
}

export async function deleteBook(id: string) {
  const { books } = await collections();
  const book = await books.findOne({ _id: id });
  if (!book) return false;
  const result = await books.deleteOne({ _id: id });
  if (result.deletedCount === 0) return false;
  await discardGridFsFiles([book.fileId, book.coverId, book.revision?.fileId, book.revision?.coverId]);
  return true;
}

export async function publishBook(id: string) {
  const { books } = await collections();
  const book = await books.findOne({ _id: id });
  if (!book) return false;
  if (book.publicationStatus === "pending") {
    const result = await books.updateOne(
      { _id: id, publicationStatus: "pending" },
      { $set: { publicationStatus: "published" }, $unset: { reviewNote: "" } },
    );
    return result.matchedCount > 0;
  }
  if (book.revision?.status !== "pending") return false;
  return applyBookRevision(book);
}

export async function rejectBook(id: string, reviewNote: string) {
  const { books } = await collections();
  const book = await books.findOne({ _id: id });
  if (!book) return false;
  if (book.publicationStatus === "pending") {
    const result = await books.updateOne(
      { _id: id, publicationStatus: "pending" },
      { $set: { publicationStatus: "rejected", reviewNote } },
    );
    return result.matchedCount > 0;
  }
  if (book.revision?.status !== "pending") return false;
  const result = await books.updateOne(
    { _id: id, "revision.status": "pending" },
    { $set: { "revision.status": "rejected", "revision.reviewNote": reviewNote } },
  );
  return result.matchedCount > 0;
}

export async function resubmitBook(
  id: string,
  submittedBy: string,
  edits: BookEdits,
  fileId?: string,
  coverId?: string,
) {
  const { books } = await collections();
  const existing = await books.findOne({
    _id: id,
    submittedBy,
    publicationStatus: { $in: ["pending", "rejected", "withdrawn"] },
  });
  if (!existing) return false;
  const result = await books.updateOne(
    { _id: id, submittedBy, publicationStatus: existing.publicationStatus },
    {
      $set: {
        ...edits,
        publicationStatus: "pending",
        ...(fileId ? { fileId } : {}),
        ...(coverId ? { coverId } : {}),
      },
      $unset: { reviewNote: "", aiSummary: "" },
    },
  );
  if (result.matchedCount === 0) return false;
  await removeReplacedFile(existing.fileId, fileId);
  await removeReplacedFile(existing.coverId, coverId);
  return true;
}

export async function withdrawBook(id: string, submittedBy: string) {
  const { books } = await collections();
  const result = await books.updateOne(
    { _id: id, submittedBy, publicationStatus: "pending" },
    { $set: { publicationStatus: "withdrawn" } },
  );
  return result.matchedCount > 0;
}

export async function deleteAuthorBook(id: string, submittedBy: string) {
  const { books } = await collections();
  const book = await books.findOne({
    _id: id,
    submittedBy,
    publicationStatus: { $in: ["pending", "rejected", "withdrawn"] },
  });
  if (!book) return false;
  const result = await books.deleteOne({ _id: id, submittedBy, publicationStatus: book.publicationStatus });
  if (result.deletedCount === 0) return false;
  await discardGridFsFiles([book.fileId, book.coverId]);
  return true;
}

export async function submitBookRevision(
  id: string,
  submittedBy: string,
  edits: BookEdits,
  fileId?: string,
  coverId?: string,
) {
  const { books } = await collections();
  const existing = await books.findOne({ _id: id, submittedBy });
  if (!existing || (existing.publicationStatus && existing.publicationStatus !== "published")) return false;
  const previous = existing.revision;
  const nextFileId = fileId ?? previous?.fileId;
  const nextCoverId = coverId ?? previous?.coverId;
  const revision: BookRevision = {
    status: "pending",
    submittedAt: new Date().toISOString().slice(0, 10),
    ...edits,
    ...(nextFileId ? { fileId: nextFileId } : {}),
    ...(nextCoverId ? { coverId: nextCoverId } : {}),
  };
  const result = await books.updateOne({ _id: id, submittedBy }, { $set: { revision } });
  if (result.matchedCount === 0) return false;
  if (fileId) await removeReplacedFile(distinctFrom(previous?.fileId, existing.fileId), fileId);
  if (coverId) await removeReplacedFile(distinctFrom(previous?.coverId, existing.coverId), coverId);
  return true;
}

export async function cancelBookRevision(id: string, submittedBy: string) {
  const { books } = await collections();
  const existing = await books.findOne({ _id: id, submittedBy });
  if (!existing?.revision) return false;
  const result = await books.updateOne({ _id: id, submittedBy }, { $unset: { revision: "" } });
  if (result.matchedCount === 0) return false;
  await discardGridFsFiles([
    distinctFrom(existing.revision.fileId, existing.fileId),
    distinctFrom(existing.revision.coverId, existing.coverId),
  ]);
  return true;
}

export async function setBookRevisionSummary(id: string, aiSummary: string) {
  const { books } = await collections();
  await books.updateOne({ _id: id, "revision.status": "pending" }, { $set: { "revision.aiSummary": aiSummary } });
}

async function applyBookRevision(book: Book) {
  const revision = book.revision;
  if (!revision) return false;
  const { books } = await collections();
  const nextFileId = revision.fileId ?? book.fileId;
  const nextCoverId = revision.coverId ?? book.coverId;
  const result = await books.updateOne(
    { _id: book._id, "revision.status": "pending" },
    {
      $set: {
        title: revision.title,
        author: revision.author,
        category: revision.category,
        year: revision.year,
        isbn: revision.isbn,
        access: revision.access,
        description: revision.description,
        publicationStatus: "published",
        ...(nextFileId ? { fileId: nextFileId } : {}),
        ...(nextCoverId ? { coverId: nextCoverId } : {}),
        ...(revision.aiSummary ? { aiSummary: revision.aiSummary } : {}),
      },
      $unset: {
        revision: "",
        reviewNote: "",
        ...(!nextFileId ? { fileId: "" } : {}),
        ...(!nextCoverId ? { coverId: "" } : {}),
        ...(!revision.aiSummary ? { aiSummary: "" } : {}),
      },
    },
  );
  if (result.matchedCount === 0) return false;
  if (revision.fileId) await removeReplacedFile(book.fileId, revision.fileId);
  if (revision.coverId) await removeReplacedFile(book.coverId, revision.coverId);
  return true;
}

function distinctFrom(candidate: string | undefined, liveId: string | undefined) {
  if (!candidate || candidate === liveId) return undefined;
  return candidate;
}

async function removeReplacedFile(previousId?: string, nextId?: string) {
  if (!nextId || !previousId || previousId === nextId) return;
  try {
    await deleteGridFsFile(previousId);
  } catch {
    // The resource already points at the replacement.
  }
}

export async function setBookSummary(id: string, aiSummary: string) {
  const { books } = await collections();
  await books.updateOne({ _id: id }, { $set: { aiSummary } });
}

export async function incrementBookReads(id: string) {
  const { books } = await collections();
  await books.updateOne({ _id: id }, { $inc: { reads: 1 } });
}
