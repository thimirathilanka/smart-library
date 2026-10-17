import { config } from "dotenv";
import { hash } from "bcryptjs";
import { GridFSBucket, MongoClient, ObjectId } from "mongodb";
import type { MemberRecord } from "../lib/types";

config({ path: ".env.local" });
config();

const demoBookIds = [
  "b-quantum",
  "b-knowledge",
  "b-climate",
  "b-manuscripts",
  "b-nlm",
  "b-biomed",
  "b-urban",
  "b-networks",
  "b-sahel",
  "b-dh",
  "b-geology",
  "b-law",
];

const demoPaperIds = [
  "p-attn",
  "p-ice",
  "p-consent",
  "p-catalog",
  "p-networks",
  "p-cities",
  "p-sahel",
  "p-algogov",
  "p-dh",
  "p-quantum",
];

const demoMemberIds = [
  "u-amelia",
  "u-jonas",
  "u-leila",
  "u-marco",
  "u-priya",
  "u-noah",
  "u-sofia",
  "u-admin",
];

type StoredFile = { _id: string; fileId?: string };

const demoMonths = [
  { month: "Mar", year: 2026 },
  { month: "Apr", year: 2026 },
  { month: "May", year: 2026 },
  { month: "Jun", year: 2026 },
  { month: "Jul", year: 2026 },
  { month: "Aug", year: 2026 },
  { month: "Sep", year: 2026 },
];

function isEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function deleteStoredFiles(
  bucket: GridFSBucket,
  fileIds: Array<string | undefined>,
) {
  for (const fileId of fileIds) {
    if (!fileId || !ObjectId.isValid(fileId)) continue;
    const id = new ObjectId(fileId);
    if (!(await bucket.find({ _id: id }).hasNext())) continue;
    await bucket.delete(id);
  }
}

async function seed() {
  const mongoUri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB ?? "nextgen-library";
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local.");
  }

  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db(dbName);

  if (process.argv.includes("--reset")) {
    const books = await db
      .collection<StoredFile>("books")
      .find({ _id: { $in: demoBookIds } })
      .project<StoredFile>({ fileId: 1 })
      .toArray();
    const papers = await db
      .collection<StoredFile>("papers")
      .find({ _id: { $in: demoPaperIds } })
      .project<StoredFile>({ fileId: 1 })
      .toArray();
    await deleteStoredFiles(
      new GridFSBucket(db),
      [...books, ...papers].map((item) => item.fileId),
    );

    const [removedBooks, removedPapers, removedMembers, removedMonths] = await Promise.all([
      db.collection<StoredFile>("books").deleteMany({ _id: { $in: demoBookIds } }),
      db.collection<StoredFile>("papers").deleteMany({ _id: { $in: demoPaperIds } }),
      db.collection<MemberRecord>("members").deleteMany({ _id: { $in: demoMemberIds } }),
      db.collection("monthlyReads").deleteMany({ $or: demoMonths }),
    ]);
    console.log(
      `Removed demo catalog: ${removedBooks.deletedCount} books, ${removedPapers.deletedCount} papers, ${removedMembers.deletedCount} members, ${removedMonths.deletedCount} monthly read rows.`,
    );
  }

  await Promise.all([
    db.collection("members").createIndex({ email: 1 }, { unique: true }),
    db.collection("books").createIndex({ category: 1 }),
    db.collection("books").createIndex({ author: 1 }),
    db.collection("papers").createIndex({ field: 1 }),
    db.collection("papers").createIndex({ keywords: 1 }),
  ]);

  const name = process.env.ADMIN_NAME?.trim() ?? "";
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  const adminConfigured = Boolean(name || email || password);
  if (adminConfigured && (!name || !email || !password)) {
    throw new Error("Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD together to create the first admin.");
  }

  if (!adminConfigured) {
    console.log("Indexes are ready. Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD to create the first admin.");
    await client.close();
    return;
  }

  if (name.length > 160 || !isEmail(email) || password.length < 8) {
    throw new Error("Admin name must be 160 characters or fewer, with a valid email and a password of at least 8 characters.");
  }

  const members = db.collection<MemberRecord>("members");
  const existing = await members.findOne({ email });
  if (existing) {
    console.log(`Account ${email} already exists. Left unchanged.`);
    await client.close();
    return;
  }

  const expires = new Date();
  expires.setUTCDate(expires.getUTCDate() + 365);
  await members.insertOne({
    _id: `u-${crypto.randomUUID()}`,
    name,
    email,
    isMember: true,
    isAdmin: true,
    isAuthor: false,
    membershipExpiresAt: expires.toISOString().slice(0, 10),
    joinedAt: new Date().toISOString().slice(0, 10),
    reads: 0,
    status: "Active",
    passwordHash: await hash(password, 10),
    library: { saved: [], history: [], favorites: [] },
  });
  console.log(`Created admin ${email}.`);
  await client.close();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
