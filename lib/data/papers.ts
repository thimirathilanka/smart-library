import "server-only";

import { collections } from "@/lib/db";
import { toPlain } from "@/lib/data/serialize";
import type { ResearchPaper } from "@/lib/types";

export async function listPapers() {
  const { papers } = await collections();
  return toPlain(await papers.find().sort({ publishedAt: -1 }).toArray());
}

export async function getPaper(id: string) {
  const { papers } = await collections();
  const paper = await papers.findOne({ _id: id });
  return paper ? toPlain(paper) : null;
}

export async function latestPapers(limit = 4) {
  const { papers } = await collections();
  return toPlain(await papers.find().sort({ publishedAt: -1 }).limit(limit).toArray());
}

export async function relatedPapers(paper: ResearchPaper, limit = 3) {
  const { papers } = await collections();
  const sameField = await papers
    .find({ _id: { $ne: paper._id }, field: paper.field })
    .limit(limit)
    .toArray();
  if (sameField.length >= limit) return sameField;
  const byKeyword = await papers
    .find({
      _id: { $nin: [paper._id, ...sameField.map((item) => item._id)] },
      keywords: { $in: paper.keywords },
    })
    .limit(limit - sameField.length)
    .toArray();
  return toPlain([...sameField, ...byKeyword]);
}

export async function createPaper(paper: ResearchPaper) {
  const { papers } = await collections();
  await papers.insertOne(paper);
}

export async function incrementPaperReads(id: string) {
  const { papers } = await collections();
  await papers.updateOne({ _id: id }, { $inc: { reads: 1 } });
}
