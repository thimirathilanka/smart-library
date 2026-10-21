export type AccessType = "open" | "members";

export type ResourceKind = "book" | "paper";

export type PublicationStatus = "pending" | "published" | "rejected" | "withdrawn";

export type RevisionStatus = "pending" | "rejected";

type RevisionMeta = {
  status: RevisionStatus;
  submittedAt: string;
  reviewNote?: string;
  fileId?: string;
  coverId?: string;
  clearCover?: boolean;
  aiSummary?: string;
};

export type BookRevision = RevisionMeta & {
  title: string;
  author: string;
  category: string;
  year: number;
  isbn: string;
  publisher: string;
  pages: number;
  language?: string;
  access: AccessType;
  description: string;
};

export type PaperRevision = RevisionMeta & {
  title: string;
  authors: string[];
  abstract: string;
  field: string;
  year: number;
  doi: string;
  venue: string;
  venueType: "journal" | "conference";
  pages?: string;
  keywords: string[];
  citations: number;
  access: AccessType;
};

export type Book = {
  _id: string;
  title: string;
  subtitle?: string;
  author: string;
  authors?: string[];
  category: string;
  year: number;
  publisher: string;
  isbn: string;
  pages: number;
  language?: string;
  access: AccessType;
  rating: number;
  ratingsCount: number;
  description: string;
  cover: {
    from: string;
    to: string;
    accent: string;
  };
  addedAt: string;
  reads: number;
  featured?: boolean;
  publicationStatus?: PublicationStatus;
  submittedBy?: string;
  reviewNote?: string;
  fileId?: string;
  coverId?: string;
  aiSummary?: string;
  embedding?: number[];
  revision?: BookRevision;
};

export type ResearchPaper = {
  _id: string;
  title: string;
  authors: string[];
  abstract: string;
  keywords: string[];
  field: string;
  year: number;
  publishedAt: string;
  venue: string;
  venueType: "journal" | "conference";
  citations: number;
  pages?: string;
  doi: string;
  access: AccessType;
  rating?: number;
  ratingsCount?: number;
  addedAt: string;
  reads: number;
  publicationStatus?: PublicationStatus;
  submittedBy?: string;
  reviewNote?: string;
  fileId?: string;
  coverId?: string;
  aiSummary?: string;
  embedding?: number[];
  revision?: PaperRevision;
};

export type ResourceRating = {
  userId: string;
  kind: ResourceKind;
  resourceId: string;
  score: number;
  updatedAt: Date;
};

export type Member = {
  _id: string;
  name: string;
  email: string;
  isMember: boolean;
  isAdmin: boolean;
  isAuthor: boolean;
  membershipExpiresAt?: string;
  joinedAt: string;
  reads: number;
  status: "Active" | "Invited" | "Suspended";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  autoRenew?: boolean;
};

export type LibraryItem = {
  resourceId: string;
  kind: ResourceKind;
  savedAt?: string;
  lastReadAt?: string;
  progress?: number;
  bookmarkPage?: number;
  totalPages?: number;
};

export type UserLibrary = {
  saved: LibraryItem[];
  history: LibraryItem[];
  favorites: LibraryItem[];
};

export type ContinueReadingItem = {
  kind: ResourceKind;
  resourceId: string;
  bookmarkPage?: number;
  totalPages?: number;
  progress?: number;
  book?: Book;
  paper?: ResearchPaper;
};

export type MemberRecord = Member & {
  passwordHash: string;
  library: UserLibrary;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  isMember: boolean;
  isAdmin: boolean;
  isAuthor: boolean;
};

export type MonthlyReads = {
  month: string;
  year: number;
  books: number;
  papers: number;
};

export type ActivityLogRecord = {
  actorId: string | null;
  action: string;
  targetKind?: string;
  targetId?: string;
  detail: string;
  createdAt: Date;
};

export type ActivityLogEntry = {
  actorId: string | null;
  actorName: string;
  action: string;
  targetKind?: string;
  targetId?: string;
  detail: string;
  createdAt: string;
};

export type NotificationRecord = {
  _id?: import("mongodb").ObjectId;
  userId: string;
  title: string;
  message: string;
  href: string;
  kind: "admin" | "author" | "reader";
  createdAt: Date;
  readAt?: Date;
};

export type NotificationEntry = {
  id: string;
  title: string;
  message: string;
  href: string;
  kind: "admin" | "author" | "reader";
  createdAt: string;
  read: boolean;
};

export type PopularResource = {
  _id: string;
  title: string;
  kind: ResourceKind;
  reads: number;
};

export type LibraryStats = {
  totalBooks: number;
  researchPapers: number;
  activeMembers: number;
  readsThisMonth: number;
};

export type RecentResource =
  | { kind: "book"; addedAt: string; book: Book; paper?: undefined }
  | { kind: "paper"; addedAt: string; paper: ResearchPaper; book?: undefined };

export type AdminCatalog = {
  books: Book[];
  papers: ResearchPaper[];
  members: Member[];
  monthlyReads: MonthlyReads[];
  popularResources: PopularResource[];
  recentActivity: ActivityLogEntry[];
};

// ─── AI Comparison Lab Types ──────────────────────────────────────────────────

export type ComparisonPurpose =
  | "general"
  | "academic"
  | "learning"
  | "technical"
  | "literature";

export type DocumentSnapshot = {
  _id: string;
  kind: ResourceKind;
  title: string;
  authors: string[];
  year: number;
  categoryOrField: string;
  coverId?: string;
  cover?: Book["cover"];
  fileId?: string;
};

export type IndividualSummary = {
  resourceId: string;
  title: string;
  mainSubject: string;
  coreContribution: string;
  targetAudience: string;
  keyTakeaway: string;
};

export type MatrixRow = {
  dimension: string;
  description: string;
  values: Record<string, string>; // resourceId -> analysis
};

export type SharedThematicItem = {
  topic: string;
  howHandled: Record<string, string>; // resourceId -> analysis
};

export type DivergentClaim = {
  topic: string;
  perspectives: Record<string, string>; // resourceId -> viewpoint
  whyTheyDiverge: string;
};

export type StrengthAndLimitation = {
  resourceId: string;
  title: string;
  strengths: string[];
  authorStatedLimitations: string[];
  aiObservedLimitations: string[];
};

export type ReadingOrderStep = {
  step: number;
  resourceId: string;
  title: string;
  rationale: string;
};

export type EvidenceCitation = {
  id: string;
  resourceId: string;
  resourceTitle: string;
  pageNumber?: number;
  sectionTitle?: string;
  quoteOrExcerpt: string;
  claimSupported: string;
  citationType: "direct_excerpt" | "author_conclusion" | "catalog_summary";
};

export type ComparisonReport = {
  purpose: ComparisonPurpose;
  customQuestion?: string;
  resources: DocumentSnapshot[];
  executiveSummary: {
    combinedSynthesis: string;
    overallConclusion: string;
    individualSummaries: IndividualSummary[];
  };
  comparisonMatrix: MatrixRow[];
  thematicComparison: {
    sharedTopics: SharedThematicItem[];
    uniqueTopics: Record<string, string[]>; // resourceId -> topics[]
    depthBreadthAnalysis: string;
    missingTopics: string[];
  };
  methodologyComparison: {
    researchDesign: Record<string, string>;
    datasetsOrFrameworks: Record<string, string>;
    evaluationAndMetrics: Record<string, string>;
    evidenceStrength: Record<string, "High" | "Moderate" | "Theoretical / Conceptual">;
    overallRigorVerdict: string;
  };
  similaritiesAndDifferences: {
    agreedArguments: string[];
    divergentClaims: DivergentClaim[];
  };
  strengthsAndLimitations: StrengthAndLimitation[];
  researchGaps: string[];
  purposeRecommendation: {
    verdict: string;
    bestForBeginners: string;
    bestForInDepthResearch: string;
    bestForPracticalImplementation: string;
    readingOrder: ReadingOrderStep[];
  };
  evidenceCitations: EvidenceCitation[];
  customQuestionAnswer?: string | null;
  generatedAt: string;
};

export type SavedComparisonRecord = {
  _id: string;
  userId: string;
  title: string;
  purpose: ComparisonPurpose;
  customQuestion?: string;
  resourceIds: string[];
  resourceSnapshots: DocumentSnapshot[];
  report: ComparisonReport;
  createdAt: string;
  updatedAt: string;
};

export type SavedComparisonSummary = {
  _id: string;
  title: string;
  purpose: ComparisonPurpose;
  resourceCount: number;
  resourceTitles: string[];
  createdAt: string;
  updatedAt: string;
};
