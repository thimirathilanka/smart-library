/** Parse the trailing "Subjects:" line from a catalog AI summary. */
export function parseAiSubjects(summary?: string): string[] {
  const text = summary?.trim() ?? "";
  if (!text) return [];
  const match = text.match(/\n?\s*Subjects:\s*(.+)$/i);
  if (!match) return [];
  return match[1]
    .split(/[,;]/)
    .map((subject) => subject.replace(/\.$/, "").trim())
    .filter(Boolean);
}

/** Normalize a subject or keyword for overlap matching. */
export function normalizeSubjectToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function subjectTokens(subjects: string[]): string[] {
  const tokens = new Set<string>();
  for (const subject of subjects) {
    const normalized = normalizeSubjectToken(subject);
    if (!normalized) continue;
    tokens.add(normalized);
    for (const word of normalized.split(" ")) {
      if (word.length >= 3) tokens.add(word);
    }
  }
  return [...tokens];
}
