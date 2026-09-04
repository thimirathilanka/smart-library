import "server-only";

import { collections } from "@/lib/db";
import { toPlain } from "@/lib/data/serialize";
import type { Book } from "@/lib/types";

export async function listBooks() {
  const { books } = await collections();
  return toPlain(await books.find().sort({ addedAt: -1 }).toArray());
}

export async function getBook(id: string) {
  const { books } = await collections();
  const book = await books.findOne({ _id: id });
  return book ? toPlain(book) : null;
}

export async function featuredBooks() {
  const { books } = await collections();
  return toPlain(await books.find({ featured: true }).sort({ reads: -1 }).toArray());
}

export async function relatedBooks(book: Book, limit = 4) {
  const { books } = await collections();
  const sameCategory = await books
    .find({ _id: { $ne: book._id }, category: book.category })
    .limit(limit)
    .toArray();
  if (sameCategory.length >= limit) return sameCategory;
  const sameAuthor = await books
    .find({
      _id: { $nin: [book._id, ...sameCategory.map((item) => item._id)] },
      author: book.author,
    })
    .limit(limit - sameCategory.length)
    .toArray();
  return toPlain([...sameCategory, ...sameAuthor]);
}

export async function createBook(book: Book) {
  const { books } = await collections();
  await books.insertOne(book);
}

export async function incrementBookReads(id: string) {
  const { books } = await collections();
  await books.updateOne({ _id: id }, { $inc: { reads: 1 } });
}
