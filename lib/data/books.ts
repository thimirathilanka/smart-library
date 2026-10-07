import "server-only";

import { collections } from "@/lib/db";
import { toPlain } from "@/lib/data/serialize";
import { withPublished } from "@/lib/data/publication";
import type { BookEdits } from "@/lib/catalog-form";
import type { Book } from "@/lib/types";

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

export async function publishBook(id: string) {
  const { books } = await collections();
  const result = await books.updateOne(
    { _id: id, publicationStatus: "pending" },
    { $set: { publicationStatus: "published" }, $unset: { reviewNote: "" } },
  );
  return result.matchedCount > 0;
}

export async function rejectBook(id: string, reviewNote: string) {
  const { books } = await collections();
  const result = await books.updateOne(
    { _id: id, publicationStatus: "pending" },
    { $set: { publicationStatus: "rejected", reviewNote } },
  );
  return result.matchedCount > 0;
}

export async function resubmitBook(id: string, submittedBy: string, edits: BookEdits) {
  const { books } = await collections();
  const result = await books.updateOne(
    { _id: id, submittedBy, publicationStatus: "rejected" },
    { $set: { ...edits, publicationStatus: "pending" }, $unset: { reviewNote: "" } },
  );
  return result.matchedCount > 0;
}

export async function incrementBookReads(id: string) {
  const { books } = await collections();
  await books.updateOne({ _id: id }, { $inc: { reads: 1 } });
}
