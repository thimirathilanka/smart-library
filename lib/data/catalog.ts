import "server-only";

import { collections } from "@/lib/db";
import { listAllBooks, listBooks } from "@/lib/data/books";
import { listAllPapers, listPapers } from "@/lib/data/papers";
import { withPublished } from "@/lib/data/publication";
import { listMembers } from "@/lib/data/members";
import { listRecentActivity } from "@/lib/data/activity";
import { toPlain } from "@/lib/data/serialize";
import type {
  AdminCatalog,
  Book,
  LibraryStats,
  MonthlyReads,
  PopularResource,
  RecentResource,
  ResearchPaper,
} from "@/lib/types";

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function getLibraryStats(): Promise<LibraryStats> {
  const { books, papers, members, monthlyReads } = await collections();
  const now = new Date();
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();
  const current = await monthlyReads.findOne({ month, year });
  const [totalBooks, researchPapers, activeMembers] = await Promise.all([
    books.countDocuments(withPublished<Book>({})),
    papers.countDocuments(withPublished<ResearchPaper>({})),
    members.countDocuments({ status: "Active" }),
  ]);
  return {
    totalBooks,
    researchPapers,
    activeMembers,
    readsThisMonth: (current?.books ?? 0) + (current?.papers ?? 0),
  };
}

export async function recentlyAdded(limit = 6): Promise<RecentResource[]> {
  const [books, papers] = await Promise.all([listBooks(), listPapers()]);
  const mixed: RecentResource[] = [
    ...books.map((book) => ({ kind: "book" as const, addedAt: book.addedAt, book })),
    ...papers.map((paper) => ({ kind: "paper" as const, addedAt: paper.addedAt, paper })),
  ];
  return mixed.sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, limit);
}

export async function getMonthlyReads() {
  const { monthlyReads } = await collections();
  return toPlain(await monthlyReads.find().sort({ year: 1 }).toArray());
}

export async function popularResources(limit = 5): Promise<PopularResource[]> {
  const [books, papers] = await Promise.all([listBooks(), listPapers()]);
  return [...books.map((book) => ({ _id: book._id, title: book.title, kind: "book" as const, reads: book.reads })),
    ...papers.map((paper) => ({ _id: paper._id, title: paper.title, kind: "paper" as const, reads: paper.reads })),
  ]
    .sort((a, b) => b.reads - a.reads)
    .slice(0, limit);
}

export async function incrementMonthlyReads(kind: "books" | "papers") {
  const { monthlyReads } = await collections();
  const now = new Date();
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();
  const existing = await monthlyReads.findOne({ month, year });
  if (!existing) {
    await monthlyReads.insertOne({
      month,
      year,
      books: kind === "books" ? 1 : 0,
      papers: kind === "papers" ? 1 : 0,
    });
    return;
  }
  await monthlyReads.updateOne({ month, year }, { $inc: { [kind]: 1 } });
}

export async function getAdminCatalog(): Promise<AdminCatalog> {
  const [books, papers, members, monthly, popular, recentActivity] = await Promise.all([
    listAllBooks(),
    listAllPapers(),
    listMembers(),
    getMonthlyReads(),
    popularResources(),
    listRecentActivity(),
  ]);
  return {
    books,
    papers,
    members,
    monthlyReads: monthly,
    popularResources: popular,
    recentActivity,
  };
}

export function sortMonthlyReads(rows: MonthlyReads[]) {
  const order = monthNames;
  return [...rows].sort((a, b) => a.year - b.year || order.indexOf(a.month) - order.indexOf(b.month));
}
