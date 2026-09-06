import "server-only";

import { collections } from "@/lib/db";
import { toPlain } from "@/lib/data/serialize";
import type { LibraryItem, Member, MemberRecord, ResourceKind, UserLibrary } from "@/lib/types";

const emptyLibrary: UserLibrary = { saved: [], history: [], favorites: [] };

export function publicMember(member: MemberRecord): Member {
  return {
    _id: member._id,
    name: member.name,
    email: member.email,
    isMember: Boolean(member.isMember),
    isAdmin: Boolean(member.isAdmin),
    joinedAt: member.joinedAt,
    reads: member.reads,
    status: member.status,
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
    progress: existing?.progress ? Math.min(100, existing.progress + 8) : 12,
  };
  const nextHistory = [nextItem, ...history.filter((item) => item.resourceId !== resourceId)];

  await members.updateOne(
    { _id: memberId },
    {
      $set: { library: { ...emptyLibrary, ...member.library, history: nextHistory } },
      $inc: { reads: 1 },
    },
  );
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
