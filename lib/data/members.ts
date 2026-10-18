import "server-only";

import { listBooks } from "@/lib/data/books";
import { listPapers } from "@/lib/data/papers";
import { collections } from "@/lib/db";
import { toPlain } from "@/lib/data/serialize";
import type { ContinueReadingItem, LibraryItem, Member, MemberRecord, ResourceKind, UserLibrary } from "@/lib/types";

const emptyLibrary: UserLibrary = { saved: [], history: [], favorites: [] };

export function hasActiveMembership(
  member: Pick<Member, "status" | "isMember" | "membershipExpiresAt"> | null | undefined,
) {
  if (!member || member.status !== "Active" || !member.isMember || !member.membershipExpiresAt) {
    return false;
  }
  return member.membershipExpiresAt >= new Date().toISOString().slice(0, 10);
}

export function isActiveAccount(member: Pick<Member, "status"> | null | undefined) {
  return Boolean(member && member.status === "Active");
}

export async function requireActiveAccount(memberId: string) {
  const member = await getMemberById(memberId);
  if (!isActiveAccount(member)) return null;
  return member;
}

export function publicMember(member: MemberRecord): Member {
  return {
    _id: member._id,
    name: member.name,
    email: member.email,
    isMember: Boolean(member.isMember),
    isAdmin: Boolean(member.isAdmin),
    isAuthor: Boolean(member.isAuthor),
    membershipExpiresAt: member.membershipExpiresAt,
    joinedAt: member.joinedAt,
    reads: member.reads,
    status: member.status,
    stripeCustomerId: member.stripeCustomerId,
    stripeSubscriptionId: member.stripeSubscriptionId,
    autoRenew: member.autoRenew,
  };
}

export async function listMembers() {
  const { members } = await collections();
  const records = await members.find().sort({ joinedAt: -1 }).toArray();
  return toPlain(records.map(publicMember));
}

export async function getMemberByEmail(email: string) {
  const { members } = await collections();
  return members.findOne({ email: email.trim().toLowerCase() });
}

export async function getMemberById(id: string) {
  const { members } = await collections();
  return members.findOne({ _id: id });
}

export async function getMemberByStripeSubscriptionId(subscriptionId: string) {
  const { members } = await collections();
  return members.findOne({ stripeSubscriptionId: subscriptionId });
}

export async function getMemberByStripeCustomerId(customerId: string) {
  const { members } = await collections();
  return members.findOne({ stripeCustomerId: customerId });
}

export async function grantMembership(
  memberId: string,
  options?: {
    days?: number;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    autoRenew?: boolean;
  },
) {
  const { members } = await collections();
  const current = await members.findOne({ _id: memberId });
  if (!current) return null;

  const today = new Date().toISOString().slice(0, 10);
  let baseDate = new Date();
  if (current.membershipExpiresAt && current.membershipExpiresAt > today) {
    baseDate = new Date(current.membershipExpiresAt);
  }

  const days = options?.days ?? 30;
  baseDate.setUTCDate(baseDate.getUTCDate() + days);
  const membershipExpiresAt = baseDate.toISOString().slice(0, 10);

  const updateSet: Record<string, unknown> = {
    isMember: true,
    membershipExpiresAt,
  };
  if (options?.stripeCustomerId) updateSet.stripeCustomerId = options.stripeCustomerId;
  if (options?.stripeSubscriptionId) updateSet.stripeSubscriptionId = options.stripeSubscriptionId;
  if (typeof options?.autoRenew === "boolean") updateSet.autoRenew = options.autoRenew;

  const result = await members.updateOne({ _id: memberId }, { $set: updateSet });
  return result.matchedCount > 0 ? membershipExpiresAt : null;
}

export async function cancelMembership(memberId: string) {
  const { members } = await collections();
  const result = await members.updateOne(
    { _id: memberId },
    {
      $set: { isMember: false, autoRenew: false },
      $unset: { membershipExpiresAt: "", stripeSubscriptionId: "" },
    },
  );
  return result.matchedCount > 0;
}

export async function setMemberAuthor(memberId: string, isAuthor: boolean) {
  const { members } = await collections();
  const result = await members.updateOne({ _id: memberId }, { $set: { isAuthor } });
  return result.matchedCount > 0;
}

export async function setMemberAdmin(
  memberId: string,
  isAdmin: boolean,
): Promise<"updated" | "not-found" | "last-admin"> {
  const { members } = await collections();
  const target = await members.findOne({ _id: memberId });
  if (!target) return "not-found";
  if (!isAdmin && target.isAdmin && target.status === "Active") {
    const activeAdmins = await members.countDocuments({ isAdmin: true, status: "Active" });
    if (activeAdmins <= 1) return "last-admin";
  }

  await members.updateOne({ _id: memberId }, { $set: { isAdmin } });
  return "updated";
}

export async function setMemberStatus(
  memberId: string,
  status: Member["status"],
): Promise<"updated" | "not-found" | "last-admin"> {
  const { members } = await collections();
  const target = await members.findOne({ _id: memberId });
  if (!target) return "not-found";
  if (status === "Suspended" && target.isAdmin && target.status === "Active") {
    const activeAdmins = await members.countDocuments({ isAdmin: true, status: "Active" });
    if (activeAdmins <= 1) return "last-admin";
  }

  await members.updateOne({ _id: memberId }, { $set: { status } });
  return "updated";
}

export async function createMember(member: MemberRecord) {
  const { members } = await collections();
  await members.insertOne({
    ...member,
    email: member.email.trim().toLowerCase(),
    library: member.library ?? emptyLibrary,
  });
}

export async function getMemberLibrary(id: string) {
  const member = await getMemberById(id);
  return toPlain(member?.library ?? emptyLibrary);
}

export async function getContinueReading(memberId: string, limit = 8): Promise<ContinueReadingItem[]> {
  const [library, books, papers] = await Promise.all([
    getMemberLibrary(memberId),
    listBooks(),
    listPapers(),
  ]);

  const booksById = new Map(books.map((book) => [book._id, book]));
  const papersById = new Map(papers.map((paper) => [paper._id, paper]));
  const items: ContinueReadingItem[] = [];

  for (const entry of library.history) {
    if (items.length >= limit) break;
    if ((entry.progress ?? 0) >= 100) continue;

    if (entry.kind === "book") {
      const book = booksById.get(entry.resourceId);
      if (!book?.fileId) continue;
      items.push({
        kind: "book",
        resourceId: entry.resourceId,
        bookmarkPage: entry.bookmarkPage,
        totalPages: entry.totalPages,
        progress: entry.progress,
        book,
      });
      continue;
    }

    const paper = papersById.get(entry.resourceId);
    if (!paper?.fileId) continue;
    items.push({
      kind: "paper",
      resourceId: entry.resourceId,
      bookmarkPage: entry.bookmarkPage,
      totalPages: entry.totalPages,
      progress: entry.progress,
      paper,
    });
  }

  return items;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export async function recordReading(memberId: string, resourceId: string, kind: ResourceKind) {
  const { members } = await collections();
  const member = await members.findOne({ _id: memberId });
  if (!member) return;

  const history = member.library?.history ?? [];
  const existing = history.find((item) => item.resourceId === resourceId && item.kind === kind);
  const nextItem: LibraryItem = {
    resourceId,
    kind,
    lastReadAt: todayIso(),
    ...(existing?.bookmarkPage && existing.totalPages
      ? { bookmarkPage: existing.bookmarkPage, totalPages: existing.totalPages, progress: existing.progress }
      : {}),
  };
  const nextHistory = [nextItem, ...history.filter((item) => item.resourceId !== resourceId || item.kind !== kind)];

  await members.updateOne(
    { _id: memberId },
    {
      $set: { library: { ...emptyLibrary, ...member.library, history: nextHistory } },
      $inc: { reads: 1 },
    },
  );
}

export async function saveReadingBookmark(
  memberId: string,
  resourceId: string,
  kind: ResourceKind,
  page: number,
  totalPages: number,
) {
  const { members } = await collections();
  const member = await members.findOne({ _id: memberId });
  if (!member) return null;

  const history = member.library?.history ?? [];
  const existing = history.find((item) => item.resourceId === resourceId && item.kind === kind);
  const progress = Math.min(100, Math.round((page / totalPages) * 100));
  const nextItem: LibraryItem = {
    ...existing,
    resourceId,
    kind,
    lastReadAt: todayIso(),
    bookmarkPage: page,
    totalPages,
    progress,
  };
  const nextHistory = [nextItem, ...history.filter((item) => item.resourceId !== resourceId || item.kind !== kind)];
  await members.updateOne(
    { _id: memberId },
    { $set: { library: { ...emptyLibrary, ...member.library, history: nextHistory } } },
  );
  return { page, totalPages, progress };
}

export async function removeReadingBookmark(memberId: string, resourceId: string, kind: ResourceKind) {
  const { members } = await collections();
  const member = await members.findOne({ _id: memberId });
  if (!member) return false;

  const history = member.library?.history ?? [];
  const nextHistory = history.map((item) => {
    if (item.resourceId !== resourceId || item.kind !== kind) return item;
    const { bookmarkPage: _bookmarkPage, totalPages: _totalPages, progress: _progress, ...withoutBookmark } = item;
    return withoutBookmark;
  });
  await members.updateOne(
    { _id: memberId },
    { $set: { library: { ...emptyLibrary, ...member.library, history: nextHistory } } },
  );
  return true;
}

export async function toggleLibraryList(
  memberId: string,
  list: "saved" | "favorites",
  resourceId: string,
  kind: ResourceKind,
) {
  const { members } = await collections();
  const member = await members.findOne({ _id: memberId });
  if (!member) return { added: false, library: emptyLibrary };

  const current = member.library?.[list] ?? [];
  const exists = current.some((item) => item.resourceId === resourceId);
  const nextList = exists
    ? current.filter((item) => item.resourceId !== resourceId)
    : [{ resourceId, kind, savedAt: todayIso() }, ...current];

  const library = { ...emptyLibrary, ...member.library, [list]: nextList };
  await members.updateOne({ _id: memberId }, { $set: { library } });
  return { added: !exists, library };
}

export async function ensureIndexes() {
  const { members, books, papers } = await collections();
  await Promise.all([
    members.createIndex({ email: 1 }, { unique: true }),
    books.createIndex({ category: 1 }),
    books.createIndex({ author: 1 }),
    papers.createIndex({ field: 1 }),
    papers.createIndex({ keywords: 1 }),
  ]);
}
