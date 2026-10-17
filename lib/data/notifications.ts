import "server-only";

import { ObjectId } from "mongodb";
import { collections } from "@/lib/db";
import type { NotificationEntry, NotificationRecord } from "@/lib/types";

type NotificationInput = Omit<NotificationRecord, "_id" | "createdAt" | "readAt">;

export async function notifyUsers(userIds: string[], input: Omit<NotificationInput, "userId">) {
  const recipients = [...new Set(userIds.filter(Boolean))];
  if (!recipients.length) return;
  try {
    const { notifications } = await collections();
    await notifications.insertMany(recipients.map((userId) => ({ ...input, userId, createdAt: new Date() })));
  } catch (error) {
    console.error("Could not create library notifications", error);
  }
}

export async function notifyAdmins(input: Omit<NotificationInput, "userId" | "kind">, exceptUserId?: string) {
  try {
    const { members } = await collections();
    const admins = await members.find({ status: "Active", isAdmin: true }).project({ _id: 1 }).toArray();
    await notifyUsers(admins.map((member) => member._id).filter((id) => id !== exceptUserId), { ...input, kind: "admin" });
  } catch (error) {
    console.error("Could not notify library admins", error);
  }
}

export async function notifyReaders(input: Omit<NotificationInput, "userId" | "kind">) {
  try {
    const { members } = await collections();
    const readers = await members.find({ status: "Active" }).project({ _id: 1 }).toArray();
    await notifyUsers(readers.map((member) => member._id), { ...input, kind: "reader" });
  } catch (error) {
    console.error("Could not notify library readers", error);
  }
}

export async function listNotifications(userId: string, limit = 100): Promise<NotificationEntry[]> {
  const { notifications } = await collections();
  const rows = await notifications.find({ userId }).sort({ createdAt: -1 }).limit(limit).toArray();
  return rows.map((row) => ({
    id: row._id?.toString() ?? "",
    title: row.title,
    message: row.message,
    href: row.href,
    kind: row.kind,
    createdAt: row.createdAt.toISOString(),
    read: Boolean(row.readAt),
  }));
}

export async function countUnreadNotifications(userId: string) {
  const { notifications } = await collections();
  return notifications.countDocuments({ userId, readAt: { $exists: false } });
}

export async function markNotificationRead(userId: string, id?: string) {
  if (id && !ObjectId.isValid(id)) return;
  const { notifications } = await collections();
  const filter = { userId, readAt: { $exists: false }, ...(id ? { _id: new ObjectId(id) } : {}) };
  await notifications.updateMany(filter, { $set: { readAt: new Date() } });
}
