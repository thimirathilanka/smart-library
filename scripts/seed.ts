import { config } from "dotenv";
import { hash } from "bcryptjs";
import { MongoClient, type AnyBulkWriteOperation } from "mongodb";
import { books, members, monthlyReads, papers, userLibrary } from "../lib/mock-data";
import type { Book, MemberRecord, MonthlyReads, ResearchPaper } from "../lib/types";

config({ path: ".env.local" });
config();

const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "nextgen-library";
const seedPassword = process.env.SEED_PASSWORD ?? "library123";

if (!mongoUri) {
  throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local.");
}

const uri: string = mongoUri;

async function seed() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const passwordHash = await hash(seedPassword, 10);
  const emptyLibrary = { saved: [], history: [], favorites: [] };

  await Promise.all([
    db.collection("members").createIndex({ email: 1 }, { unique: true }),
    db.collection("books").createIndex({ category: 1 }),
    db.collection("books").createIndex({ author: 1 }),
    db.collection("papers").createIndex({ field: 1 }),
    db.collection("papers").createIndex({ keywords: 1 }),
  ]);

  const bookOps: AnyBulkWriteOperation<Book>[] = books.map((book) => ({
    updateOne: { filter: { _id: book._id }, update: { $set: book }, upsert: true },
  }));
  await db.collection<Book>("books").bulkWrite(bookOps);

  const paperOps: AnyBulkWriteOperation<ResearchPaper>[] = papers.map((paper) => ({
    updateOne: { filter: { _id: paper._id }, update: { $set: paper }, upsert: true },
  }));
  await db.collection<ResearchPaper>("papers").bulkWrite(paperOps);

  const memberOps: AnyBulkWriteOperation<MemberRecord>[] = members.map((member) => ({
    updateOne: {
      filter: { _id: member._id },
      update: {
        $set: {
          ...member,
          email: member.email.toLowerCase(),
          passwordHash,
          library: member._id === "u-amelia" ? userLibrary : emptyLibrary,
        },
        $unset: { department: "", role: "", plan: "" },
      },
      upsert: true,
    },
  }));
  await db.collection<MemberRecord>("members").bulkWrite(memberOps);

  const monthOps: AnyBulkWriteOperation<MonthlyReads>[] = monthlyReads.map((row) => ({
    updateOne: {
      filter: { month: row.month, year: row.year },
      update: { $set: row },
      upsert: true,
    },
  }));
  await db.collection<MonthlyReads>("monthlyReads").bulkWrite(monthOps);

  console.log(`Seeded ${books.length} books, ${papers.length} papers, ${members.length} members.`);
  console.log(`Seed password for all members: ${seedPassword}`);
  console.log("Admin login: admin@nextgen.library");
  await client.close();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
