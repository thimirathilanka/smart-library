import "server-only";

import { GridFSBucket, MongoClient, ObjectId, type Collection, type Db, type Document } from "mongodb";
import type { ActivityLogRecord, Book, MemberRecord, MonthlyReads, NotificationRecord, ResearchPaper, ResourceRating } from "@/lib/types";

const dbName = process.env.MONGODB_DB ?? "nextgen-library";

type GlobalMongo = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

function getUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local.");
  }
  return uri;
}

function getClientPromise() {
  const globalMongo = globalThis as GlobalMongo;
  if (!globalMongo._mongoClientPromise) {
    const connection = new MongoClient(getUri()).connect();
    globalMongo._mongoClientPromise = connection.catch((error: unknown) => {
      // A transient DNS/TLS/network failure must not leave a rejected promise
      // cached for the rest of the development server's lifetime.
      globalMongo._mongoClientPromise = undefined;
      throw error;
    });
  }
  return globalMongo._mongoClientPromise;
}

export async function getMongoClient() {
  return getClientPromise();
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(dbName);
}

export async function deleteGridFsFile(fileId?: string) {
  if (!fileId || !ObjectId.isValid(fileId)) return false;
  const bucket = new GridFSBucket(await getDb());
  const id = new ObjectId(fileId);
  if (!(await bucket.find({ _id: id }).hasNext())) return false;
  await bucket.delete(id);
  return true;
}

export async function uploadGridFsFile(file: File, contentType = "application/pdf") {
  const bucket = new GridFSBucket(await getDb());
  const upload = bucket.openUploadStream(file.name, {
    metadata: { contentType },
  });
  try {
    const { pipeline } = await import("node:stream/promises");
    const { Readable } = await import("node:stream");
    await pipeline(
      Readable.fromWeb(file.stream() as unknown as import("node:stream/web").ReadableStream<Uint8Array>),
      upload,
    );
    return upload.id.toString();
  } catch (error) {
    await upload.abort().catch(() => undefined);
    throw error;
  }
}

export async function gridFsFilenames(fileIds: Array<string | undefined>) {
  const ids = [...new Set(fileIds.filter((id): id is string => Boolean(id && ObjectId.isValid(id))))];
  const names = new Map<string, string>();
  if (!ids.length) return names;
  const bucket = new GridFSBucket(await getDb());
  const files = await bucket.find({ _id: { $in: ids.map((id) => new ObjectId(id)) } }).toArray();
  for (const file of files) names.set(file._id.toString(), file.filename);
  return names;
}

export async function openGridFsDownload(fileId: string) {
  const file = await openGridFsFile(fileId);
  return file?.stream ?? null;
}

export async function openGridFsFile(fileId: string) {
  if (!ObjectId.isValid(fileId)) return null;
  const bucket = new GridFSBucket(await getDb());
  const id = new ObjectId(fileId);
  const file = await bucket.find({ _id: id }).next();
  if (!file) return null;
  const contentType =
    typeof file.metadata?.contentType === "string" ? file.metadata.contentType : "application/octet-stream";
  return { stream: bucket.openDownloadStream(id), contentType, filename: file.filename };
}

export async function discardGridFsFiles(ids: Array<string | undefined>) {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  await Promise.all(
    unique.map(async (id) => {
      try {
        await deleteGridFsFile(id);
      } catch {
        // A replaced file can already be gone.
      }
    }),
  );
}

export async function collections() {
  const db = await getDb();
  return {
    books: db.collection<Book>("books") as Collection<Book>,
    papers: db.collection<ResearchPaper>("papers") as Collection<ResearchPaper>,
    members: db.collection<MemberRecord>("members") as Collection<MemberRecord>,
    monthlyReads: db.collection<MonthlyReads>("monthlyReads") as Collection<MonthlyReads>,
    activityLogs: db.collection<ActivityLogRecord>("activityLogs") as Collection<ActivityLogRecord>,
    notifications: db.collection<NotificationRecord>("notifications") as Collection<NotificationRecord>,
    ratings: db.collection<ResourceRating>("ratings") as Collection<ResourceRating>,
  };
}

export type { Document };
