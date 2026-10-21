import "server-only";

import { extractPdfPageSnippets, type PdfPageSnippet } from "@/lib/ai/pdf-excerpt";
import type {
  ComparisonPurpose,
  ComparisonReport,
  DocumentSnapshot,
  EvidenceCitation,
  IndividualSummary,
  MatrixRow,
  ReadingOrderStep,
  SharedThematicItem,
  StrengthAndLimitation,
} from "@/lib/types";

const REASONING_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3-flash-preview",
  "gemini-3.5-flash",
];
const API_URL = "https://generativelanguage.googleapis.com/v1beta";

async function callGeminiWithFallback(prompt: string, apiKey: string, maxTokens = 6000): Promise<string> {
  let lastError: Error | null = null;

  for (const model of REASONING_MODELS) {
    try {
      const response = await fetch(`${API_URL}/models/${model}:generateContent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: maxTokens,
          },
        }),
      });

      if (response.status === 429 || response.status === 503) {
        console.warn(`[compare-engine] Model ${model} returned status ${response.status}, waiting and trying next model...`);
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        console.warn(`[compare-engine] Model ${model} returned status ${response.status}: ${errText.slice(0, 150)}`);
        continue;
      }

      const rawJson = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
      };

      const parts = rawJson.candidates?.[0]?.content?.parts ?? [];
      let text = "";
      for (const p of parts) {
        if (p.text && !p.thought) text = p.text.trim();
      }
      if (!text && parts.length > 0 && parts[0].text) {
        text = parts[0].text.trim();
      }

      if (text) return text;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[compare-engine] Model ${model} failed:`, err);
    }
  }

  throw lastError ?? new Error("All AI models are currently rate-limited or busy. Please try again in a few moments.");
}

type RawDocumentInfo = DocumentSnapshot & {
  descriptionOrAbstract: string;
  aiSummary?: string;
  keywords?: string[];
  publisherOrVenue?: string;
  pages?: PdfPageSnippet[];
};

export async function prepareDocumentInfo(
  doc: DocumentSnapshot & {
    descriptionOrAbstract: string;
    aiSummary?: string;
    keywords?: string[];
    publisherOrVenue?: string;
  },
): Promise<RawDocumentInfo> {
  const pages = doc.fileId ? await extractPdfPageSnippets(doc.fileId, 8) : [];
  return {
    ...doc,
    pages,
  };
}

function formatDocumentForPrompt(doc: RawDocumentInfo, index: number): string {
  const lines: string[] = [
    `=== Document [${index + 1}] ID: "${doc._id}" ===`,
    `Type: ${doc.kind.toUpperCase()}`,
    `Title: "${doc.title}"`,
    `Authors: ${doc.authors.join(", ")}`,
    `Year: ${doc.year}`,
    `Subject/Category: ${doc.categoryOrField}`,
  ];

  if (doc.publisherOrVenue) {
    lines.push(`Venue/Publisher: ${doc.publisherOrVenue}`);
  }
  if (doc.keywords?.length) {
    lines.push(`Keywords: ${doc.keywords.join(", ")}`);
  }

  lines.push(`Description/Abstract: ${doc.descriptionOrAbstract}`);

  if (doc.aiSummary) {
    lines.push(`Catalog In-depth Summary: ${doc.aiSummary}`);
  }

  if (doc.pages && doc.pages.length > 0) {
    lines.push(`--- Actual Document Excerpts (Pages 1 to ${doc.pages.length}) ---`);
    for (const p of doc.pages) {
      lines.push(`[Page ${p.pageNumber}]: ${p.text.slice(0, 1400)}`);
    }
  } else {
    lines.push(`[Note: Full PDF file not attached. Base analysis on title, abstract, and comprehensive catalog record.]`);
  }

  return lines.join("\n");
}

export async function runAiDocumentComparison(params: {
  documents: RawDocumentInfo[];
  purpose: ComparisonPurpose;
  customQuestion?: string;
}): Promise<ComparisonReport> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const { documents, purpose, customQuestion } = params;
  if (documents.length < 2 || documents.length > 4) {
    throw new Error("Comparison requires between 2 and 4 documents.");
  }

  const docContexts = documents.map((d, i) => formatDocumentForPrompt(d, i)).join("\n\n");

  const purposeDescriptions: Record<ComparisonPurpose, string> = {
    general: "Broad intellectual comparison for curious readers and general knowledge.",
    academic: "Rigorous academic research evaluating methodologies, evidence quality, and scholarly claims.",
    learning: "Educational synthesis for students preparing for exams, learning concepts, and understanding fundamentals.",
    technical: "Engineering and technical implementation comparison focusing on algorithms, architecture, tradeoffs, and practical viability.",
    literature: "Comprehensive literature review mapping themes, intellectual lineages, and research frontiers.",
  };

  const prompt = `You are a distinguished research director and comparative literature analyst.
Perform an exhaustive, multi-document comparison of the following ${documents.length} sources.

SELECTED COMPARISON PURPOSE:
"${purpose.toUpperCase()}" — ${purposeDescriptions[purpose]}

${customQuestion ? `USER SPECIFIC INQUIRY TO ANSWER:\n"${customQuestion}"\n` : ""}

DOCUMENTS UNDER ANALYSIS:
${docContexts}

STRICT INSTRUCTIONS:
1. Ground your analysis strictly in the provided document contents, abstracts, and page excerpts.
2. If a criterion is not addressed in a document, output "Not specified" or "Insufficient evidence". Do NOT fabricate or hallucinate information.
3. For Citations: Provide genuine, verifiable excerpts from the text. Include page numbers where provided in the text; if based on the catalog abstract, set citationType to "catalog_summary".
4. Distinguish between author-stated limitations vs AI-observed limitations.
5. In the Comparison Matrix, include all ${documents.length} document IDs as keys in each row's 'values' object.
6. Return ONLY a valid JSON object matching the requested schema. No markdown formatting, backticks, or extra commentary.

REQUIRED JSON OUTPUT SCHEMA:
{
  "executiveSummary": {
    "combinedSynthesis": "<2-3 paragraphs synthesizing the core arguments, relationships, and significance across all sources>",
    "overallConclusion": "<1-2 sentence decisive summary conclusion>",
    "individualSummaries": [
      {
        "resourceId": "<doc _id>",
        "title": "<doc title>",
        "mainSubject": "<exact subject>",
        "coreContribution": "<specific core thesis or finding, max 30 words>",
        "targetAudience": "<intended reader>",
        "keyTakeaway": "<key lesson>"
      }
    ]
  },
  "comparisonMatrix": [
    {
      "dimension": "Core Problem & Objective",
      "description": "What primary problem or thesis does each source address?",
      "values": { "<doc _id>": "<analysis>" }
    },
    {
      "dimension": "Target Audience & Prerequisites",
      "description": "Assumed background knowledge and intended readership",
      "values": { "<doc _id>": "<analysis>" }
    },
    {
      "dimension": "Theoretical & Technical Depth",
      "description": "Level of mathematical, conceptual, or architectural rigor",
      "values": { "<doc _id>": "<analysis>" }
    },
    {
      "dimension": "Methodology & Evidence Base",
      "description": "Empirical datasets, mathematical proofs, experimental setups, or literature synthesis",
      "values": { "<doc _id>": "<analysis>" }
    },
    {
      "dimension": "Key Frameworks & Tools",
      "description": "Algorithms, software frameworks, models, or theoretical systems used",
      "values": { "<doc _id>": "<analysis>" }
    },
    {
      "dimension": "Primary Findings & Contributions",
      "description": "Major conclusions, theorems, or conceptual breakthroughs",
      "values": { "<doc _id>": "<analysis>" }
    },
    {
      "dimension": "Practical Implementation Usability",
      "description": "How readily the concepts can be applied in real-world scenarios",
      "values": { "<doc _id>": "<analysis>" }
    },
    {
      "dimension": "Major Stated Limitations",
      "description": "Explicit limitations, boundary conditions, or unaddressed edge cases",
      "values": { "<doc _id>": "<analysis>" }
    }
  ],
  "thematicComparison": {
    "sharedTopics": [
      {
        "topic": "<topic name>",
        "howHandled": { "<doc _id>": "<how this source addresses it>" }
      }
    ],
    "uniqueTopics": {
      "<doc _id>": ["<topic 1>", "<topic 2>"]
    },
    "depthBreadthAnalysis": "<paragraph evaluating breadth vs depth>",
    "missingTopics": ["<topic missing across all sources>"]
  },
  "methodologyComparison": {
    "researchDesign": { "<doc _id>": "<design details>" },
    "datasetsOrFrameworks": { "<doc _id>": "<dataset or framework details>" },
    "evaluationAndMetrics": { "<doc _id>": "<metrics details>" },
    "evidenceStrength": { "<doc _id>": "High" },
    "overallRigorVerdict": "<paragraph on comparative research rigor>"
  },
  "similaritiesAndDifferences": {
    "agreedArguments": [
      "<point of agreement 1>",
      "<point of agreement 2>"
    ],
    "divergentClaims": [
      {
        "topic": "<disputed or divergent topic>",
        "perspectives": { "<doc _id>": "<position taken>" },
        "whyTheyDiverge": "<objective explanation of differing assumptions or contexts>"
      }
    ]
  },
  "strengthsAndLimitations": [
    {
      "resourceId": "<doc _id>",
      "title": "<doc title>",
      "strengths": ["<strength 1>", "<strength 2>"],
      "authorStatedLimitations": ["<limitation stated by author>"],
      "aiObservedLimitations": ["<limitation observed by AI>"]
    }
  ],
  "researchGaps": [
    "<unanswered question or open research opportunity 1>",
    "<unanswered question or open research opportunity 2>"
  ],
  "purposeRecommendation": {
    "verdict": "<explicit verdict recommending the most suitable source for the selected purpose>",
    "bestForBeginners": "<doc title and rationale>",
    "bestForInDepthResearch": "<doc title and rationale>",
    "bestForPracticalImplementation": "<doc title and rationale>",
    "readingOrder": [
      {
        "step": 1,
        "resourceId": "<doc _id>",
        "title": "<doc title>",
        "rationale": "<why read this first>"
      }
    ]
  },
  "evidenceCitations": [
    {
      "id": "cit-1",
      "resourceId": "<doc _id>",
      "resourceTitle": "<doc title>",
      "pageNumber": 1,
      "sectionTitle": "<section heading if identifiable>",
      "quoteOrExcerpt": "<exact 1-2 sentence supporting quote from text>",
      "claimSupported": "<which claim in this report this quote proves>",
      "citationType": "direct_excerpt"
    }
  ],
  "customQuestionAnswer": ${customQuestion ? '"<comprehensive, direct answer addressing the user\'s custom question with citations>"' : "null"}
}`;

  let text = await callGeminiWithFallback(prompt, apiKey, 6000);

  // Strip markdown fences
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();

  // Extract JSON object
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI returned a response without valid structured JSON.");
  }

  const parsed = JSON.parse(jsonMatch[0]) as Partial<ComparisonReport>;

  // Convert DocumentSnapshots
  const resourceSnapshots: DocumentSnapshot[] = documents.map((d) => ({
    _id: d._id,
    kind: d.kind,
    title: d.title,
    authors: d.authors,
    year: d.year,
    categoryOrField: d.categoryOrField,
    coverId: d.coverId,
    cover: d.cover,
    fileId: d.fileId,
  }));

  const report: ComparisonReport = {
    purpose,
    customQuestion: customQuestion?.trim() || undefined,
    resources: resourceSnapshots,
    executiveSummary: {
      combinedSynthesis:
        parsed.executiveSummary?.combinedSynthesis ||
        "A synthesized comparison across the selected library documents.",
      overallConclusion:
        parsed.executiveSummary?.overallConclusion ||
        "The selected sources present complementary insights on their respective topics.",
      individualSummaries: Array.isArray(parsed.executiveSummary?.individualSummaries)
        ? parsed.executiveSummary.individualSummaries
        : resourceSnapshots.map((r) => ({
            resourceId: r._id,
            title: r.title,
            mainSubject: r.categoryOrField,
            coreContribution: "Investigates core concepts within " + r.categoryOrField,
            targetAudience: "Researchers and students",
            keyTakeaway: r.title,
          })),
    },
    comparisonMatrix: Array.isArray(parsed.comparisonMatrix) ? parsed.comparisonMatrix : [],
    thematicComparison: {
      sharedTopics: Array.isArray(parsed.thematicComparison?.sharedTopics)
        ? parsed.thematicComparison.sharedTopics
        : [],
      uniqueTopics: parsed.thematicComparison?.uniqueTopics || {},
      depthBreadthAnalysis:
        parsed.thematicComparison?.depthBreadthAnalysis ||
        "The documents range across specialized deep investigation and broad foundational overviews.",
      missingTopics: Array.isArray(parsed.thematicComparison?.missingTopics)
        ? parsed.thematicComparison.missingTopics
        : [],
    },
    methodologyComparison: {
      researchDesign: parsed.methodologyComparison?.researchDesign || {},
      datasetsOrFrameworks: parsed.methodologyComparison?.datasetsOrFrameworks || {},
      evaluationAndMetrics: parsed.methodologyComparison?.evaluationAndMetrics || {},
      evidenceStrength: parsed.methodologyComparison?.evidenceStrength || {},
      overallRigorVerdict:
        parsed.methodologyComparison?.overallRigorVerdict ||
        "Each document aligns with standards of research and academic documentation in its domain.",
    },
    similaritiesAndDifferences: {
      agreedArguments: Array.isArray(parsed.similaritiesAndDifferences?.agreedArguments)
        ? parsed.similaritiesAndDifferences.agreedArguments
        : [],
      divergentClaims: Array.isArray(parsed.similaritiesAndDifferences?.divergentClaims)
        ? parsed.similaritiesAndDifferences.divergentClaims
        : [],
    },
    strengthsAndLimitations: Array.isArray(parsed.strengthsAndLimitations)
      ? parsed.strengthsAndLimitations
      : resourceSnapshots.map((r) => ({
          resourceId: r._id,
          title: r.title,
          strengths: ["Provides foundational insights in " + r.categoryOrField],
          authorStatedLimitations: ["Focused scope on specific sub-disciplines"],
          aiObservedLimitations: ["Assumes familiarity with prerequisite domain vocabulary"],
        })),
    researchGaps: Array.isArray(parsed.researchGaps)
      ? parsed.researchGaps
      : ["Further empirical research is warranted to validate generalized outcomes."],
    purposeRecommendation: {
      verdict:
        parsed.purposeRecommendation?.verdict ||
        "Review the recommended reading order to maximize comprehension.",
      bestForBeginners: parsed.purposeRecommendation?.bestForBeginners || resourceSnapshots[0]?.title || "",
      bestForInDepthResearch:
        parsed.purposeRecommendation?.bestForInDepthResearch ||
        resourceSnapshots[resourceSnapshots.length - 1]?.title ||
        "",
      bestForPracticalImplementation:
        parsed.purposeRecommendation?.bestForPracticalImplementation ||
        resourceSnapshots[0]?.title ||
        "",
      readingOrder: Array.isArray(parsed.purposeRecommendation?.readingOrder)
        ? parsed.purposeRecommendation.readingOrder
        : resourceSnapshots.map((r, i) => ({
            step: i + 1,
            resourceId: r._id,
            title: r.title,
            rationale: i === 0 ? "Read first for foundational grounding." : "Read next for deeper concepts.",
          })),
    },
    evidenceCitations: Array.isArray(parsed.evidenceCitations) ? parsed.evidenceCitations : [],
    customQuestionAnswer: parsed.customQuestionAnswer || null,
    generatedAt: new Date().toISOString(),
  };

  return report;
}

export async function askComparisonFollowUp(params: {
  report: ComparisonReport;
  question: string;
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const { report, question } = params;

  const docSummaries = report.resources
    .map(
      (r, i) =>
        `[Document ${i + 1}]: "${r.title}" by ${r.authors.join(", ")} (${r.year}, ${r.categoryOrField})`,
    )
    .join("\n");

  const prompt = `You are an expert research advisor discussing an already generated comparison report across these ${report.resources.length} documents:
${docSummaries}

Report Executive Summary:
${report.executiveSummary.combinedSynthesis}

Key Differences:
${report.similaritiesAndDifferences.divergentClaims.map((d) => `- ${d.topic}: ${d.whyTheyDiverge}`).join("\n")}

User Follow-Up Question:
"${question}"

Instructions:
1. Answer the user's question directly, concisely, and insightfully based on the documents.
2. Ground your answer in specific claims made by the documents. Name the documents specifically when contrasting their stances.
3. Keep response well-formatted with markdown bullet points or bold titles where helpful. Max 250 words.`;

  try {
    const answer = await callGeminiWithFallback(prompt, apiKey, 1200);
    return answer || "Unable to generate an answer for this inquiry.";
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : "Failed to generate follow-up answer.");
  }
}
