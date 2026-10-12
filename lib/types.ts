export type AccessType = "open" | "members";

export type ResourceKind = "book" | "paper";

export type PublicationStatus = "pending" | "published" | "rejected";

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
  language: string;
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
  aiSummary?: string;
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
  pages: string;
  doi: string;
  access: AccessType;
  addedAt: string;
  reads: number;
  publicationStatus?: PublicationStatus;
  submittedBy?: string;
  reviewNote?: string;
  fileId?: string;
  aiSummary?: string;
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
};

export type LibraryItem = {
  resourceId: string;
  kind: ResourceKind;
  savedAt?: string;
  lastReadAt?: string;
  progress?: number;
};

export type UserLibrary = {
  saved: LibraryItem[];
  history: LibraryItem[];
  favorites: LibraryItem[];
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
};
