import "server-only";

import { collections } from "@/lib/db";
import type { ActivityLogEntry, ActivityLogRecord } from "@/lib/types";

type ActivityInput = Omit<ActivityLogRecord, "createdAt">;

// Activity logging should never turn a completed user action into an error.
export async function recordActivity(input: ActivityInput) {
  try {
    const { activityLogs } = await collections();
    await activityLogs.insertOne({ ...input, createdAt: new Date() });
  } catch (error) {
    console.error("Could not record library activity", error);
  }
}

export async function listRecentActivity(limit = 50): Promise<ActivityLogEntry[]> {
  const { activityLogs, members } = await collections();
  const rows = await activityLogs.find().sort({ createdAt: -1 }).limit(limit).toArray();
  const actorIds = [...new Set(rows.flatMap((row) => row.actorId ? [row.actorId] : []))];
  const actorRecords = actorIds.length
    ? await members.find({ _id: { $in: actorIds } }).project({ _id: 1, name: 1 }).toArray()
    : [];
  const names = new Map(actorRecords.map((member) => [member._id, member.name]));

  return rows.map((row) => ({
    actorId: row.actorId,
    actorName: row.actorId ? names.get(row.actorId) ?? "Former member" : "Guest",
    action: row.action,
    ...(row.targetKind ? { targetKind: row.targetKind } : {}),
    ...(row.targetId ? { targetId: row.targetId } : {}),
    detail: row.detail,
    createdAt: row.createdAt.toISOString(),
  }));
}
