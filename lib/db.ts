import "server-only";

import { GridFSBucket, MongoClient, ObjectId, type Collection, type Db, type Document } from "mongodb";
import type { Book, MemberRecord, MonthlyReads, ResearchPaper } from "@/lib/types";

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
    globalMongo._mongoClientPromise = new MongoClient(getUri()).connect();
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

export async function collections() {
  const db = await getDb();
  return {
    books: db.collection<Book>("books") as Collection<Book>,
    papers: db.collection<ResearchPaper>("papers") as Collection<ResearchPaper>,
    members: db.collection<MemberRecord>("members") as Collection<MemberRecord>,
    monthlyReads: db.collection<MonthlyReads>("monthlyReads") as Collection<MonthlyReads>,
  };
}

export type { Document };
