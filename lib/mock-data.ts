import type {
  Book,
  Member,
  MonthlyReads,
  PopularResource,
  ResearchPaper,
  UserLibrary,
} from "./types";

export const books: Book[] = [
  {
    _id: "b-quantum",
    title: "Principles of Quantum Computing",
    subtitle: "From qubits to error-corrected machines",
    author: "Elena Voss",
    category: "Computer Science",
    year: 2023,
    publisher: "Helios Academic Press",
    isbn: "978-1-4021-8841-2",
    pages: 486,
    language: "English",
    access: "open",
    rating: 4.8,
    ratingsCount: 312,
    description:
      "A rigorous yet approachable treatment of quantum information, covering circuit models, entanglement, variational algorithms, and the engineering constraints of near-term devices. Written for graduate students and researchers crossing into the field.",
    cover: { from: "#0B1F3A", to: "#1B4F8A", accent: "#C9A227" },
    addedAt: "2026-08-12",
    reads: 18420,
    featured: true,
  },
  {
    _id: "b-knowledge",
    title: "The Architecture of Knowledge",
    subtitle: "Libraries, memory, and the digital commons",
    author: "Marcus Hale",
    category: "Information Science",
    year: 2021,
    publisher: "Harbor Academic Press",
    isbn: "978-0-521-77301-8",
    pages: 352,
    language: "English",
    access: "members",
    rating: 4.6,
    ratingsCount: 198,
    description:
      "Hale traces how cataloguing systems, from medieval scriptoria to linked open data, shape what societies remember. The book argues that metadata is never neutral and offers a design ethics for scholarly infrastructure.",
    cover: { from: "#1A2F23", to: "#3D6B4F", accent: "#E8D5A3" },
    addedAt: "2026-07-02",
    reads: 9730,
    featured: true,
  },
  {
    _id: "b-climate",
    title: "Climate Systems of the Anthropocene",
    author: "Priya Natarajan",
    category: "Environmental Science",
    year: 2024,
    publisher: "Helios Earth Studies",
    isbn: "978-3-16-148410-0",
    pages: 528,
    language: "English",
    access: "open",
    rating: 4.9,
    ratingsCount: 441,
    description:
      "An integrated account of coupled atmosphere–ocean dynamics, carbon cycle feedbacks, and regional extremes. Natarajan pairs observational records with accessible climate-model diagnostics for researchers and policy analysts.",
    cover: { from: "#12324A", to: "#2A7A6A", accent: "#F0C27A" },
    addedAt: "2026-08-28",
    reads: 22110,
    featured: true,
  },
  {
    _id: "b-manuscripts",
    title: "Medieval Manuscript Cultures",
    subtitle: "Scribes, patrons, and the page",
    author: "Thomas Whitaker",
    category: "History",
    year: 2019,
    publisher: "Ashbourne Medieval Series",
    isbn: "978-1-107-03421-6",
    pages: 410,
    language: "English",
    access: "members",
    rating: 4.4,
    ratingsCount: 127,
    description:
      "A material history of European manuscript production between 1100 and 1500, with close readings of illumination workshops, monastic libraries, and the transition to print. Richly illustrated with palaeographic plates.",
    cover: { from: "#4A1C14", to: "#8B3A2A", accent: "#D4AF77" },
    addedAt: "2026-05-19",
    reads: 6410,
  },
  {
    _id: "b-nlm",
    title: "Neural Language Models",
    subtitle: "Representation, alignment, and evaluation",
    author: "Aisha Rahman",
    category: "Computer Science",
    year: 2024,
    publisher: "Cascade ML Press",
    isbn: "978-0-262-04682-4",
    pages: 394,
    language: "English",
    access: "open",
    rating: 4.7,
    ratingsCount: 509,
    description:
      "Rahman surveys transformer architectures, scaling laws, and the empirical science of alignment. The volume balances mathematical exposition with laboratory-style evaluation protocols used in contemporary NLP research.",
    cover: { from: "#1B1B3A", to: "#4C3A8C", accent: "#7EE0C8" },
    addedAt: "2026-08-04",
    reads: 19880,
    featured: true,
  },
  {
    _id: "b-biomed",
    title: "Ethics in Biomedical Research",
    author: "Helen Cho",
    category: "Medicine",
    year: 2022,
    publisher: "Lancet Academic",
    isbn: "978-0-19-884512-3",
    pages: 288,
    language: "English",
    access: "members",
    rating: 4.5,
    ratingsCount: 176,
    description:
      "A practical ethics handbook for clinical investigators, covering consent, data stewardship, dual-use research, and equity in trial design. Case studies draw on oncology, genomics, and global health partnerships.",
    cover: { from: "#1E3A4C", to: "#2F6F8F", accent: "#F4B4A4" },
    addedAt: "2026-06-11",
    reads: 8120,
  },
  {
    _id: "b-urban",
    title: "Urban Design After Oil",
    author: "Julian Ortega",
    category: "Architecture",
    year: 2020,
    publisher: "Studio City Press",
    isbn: "978-1-988-22041-7",
    pages: 336,
    language: "English",
    access: "open",
    rating: 4.3,
    ratingsCount: 154,
    description:
      "Ortega examines post-carbon streetscapes, mobility networks, and housing typologies across twelve cities. The book is both a design manifesto and a documented studio method for metropolitan planning studios.",
    cover: { from: "#2C2416", to: "#8A6A32", accent: "#EDE6D6" },
    addedAt: "2026-04-22",
    reads: 7050,
  },
  {
    _id: "b-networks",
    title: "The Mathematics of Networks",
    author: "Wei Chen",
    category: "Mathematics",
    year: 2023,
    publisher: "Princeton Scholar",
    isbn: "978-0-691-19880-1",
    pages: 462,
    language: "English",
    access: "open",
    rating: 4.8,
    ratingsCount: 267,
    description:
      "Graph theory, spectral methods, and stochastic processes for complex networks. Chen develops proofs alongside computational notebooks, making the text suitable for applied mathematicians and network scientists.",
    cover: { from: "#0E2A44", to: "#1E5A8A", accent: "#F2D06B" },
    addedAt: "2026-07-29",
    reads: 11440,
    featured: true,
  },
  {
    _id: "b-sahel",
    title: "Oral Histories of the Sahel",
    author: "Fatima Diallo",
    category: "Anthropology",
    year: 2021,
    publisher: "Sahel Studies Collective",
    isbn: "978-2-343-18920-5",
    pages: 374,
    language: "English",
    access: "members",
    rating: 4.6,
    ratingsCount: 98,
    description:
      "A polyphonic ethnography assembled from three decades of recorded testimony across Mali, Niger, and Senegal. Diallo theorizes listening as method and archives the political life of drought, migration, and kinship.",
    cover: { from: "#5A3A18", to: "#C4893A", accent: "#F6E7C1" },
    addedAt: "2026-03-08",
    reads: 4280,
  },
  {
    _id: "b-dh",
    title: "Introduction to Digital Humanities",
    author: "Sarah Blackwell",
    category: "Humanities",
    year: 2022,
    publisher: "Open Syllabus Press",
    isbn: "978-1-60918-610-4",
    pages: 318,
    language: "English",
    access: "open",
    rating: 4.2,
    ratingsCount: 221,
    description:
      "A classroom-ready survey of text analysis, mapping, scholarly editing, and public humanities. Blackwell emphasizes reproducible workflows and the politics of digitization in galleries, libraries, archives, and museums.",
    cover: { from: "#2A1848", to: "#6B3FA0", accent: "#E6C36A" },
    addedAt: "2026-05-30",
    reads: 13650,
  },
  {
    _id: "b-geology",
    title: "Planetary Geology",
    subtitle: "Surfaces of the inner solar system",
    author: "Omar Haddad",
    category: "Earth Science",
    year: 2024,
    publisher: "Helios Earth Studies",
    isbn: "978-0-387-98745-2",
    pages: 540,
    language: "English",
    access: "open",
    rating: 4.7,
    ratingsCount: 188,
    description:
      "Comparative geology of Mercury, Venus, Earth, Moon, and Mars, synthesizing orbiter imagery, sample return, and geophysical models. Designed for advanced undergraduates and planetary science seminars.",
    cover: { from: "#3A2418", to: "#8B4A28", accent: "#D8C4A8" },
    addedAt: "2026-08-18",
    reads: 8890,
    featured: true,
  },
  {
    _id: "b-law",
    title: "Law and Algorithmic Governance",
    author: "Nadia Petrov",
    category: "Law",
    year: 2023,
    publisher: "Clarendon Legal",
    isbn: "978-0-19-285901-7",
    pages: 402,
    language: "English",
    access: "members",
    rating: 4.5,
    ratingsCount: 143,
    description:
      "Petrov maps constitutional, administrative, and private-law responses to automated decision-making. The book is widely cited in seminars on AI regulation, due process, and public-sector procurement.",
    cover: { from: "#121C33", to: "#2C4A7A", accent: "#C9B037" },
    addedAt: "2026-06-26",
    reads: 7670,
  },
];

export const papers: ResearchPaper[] = [
  {
    _id: "p-attn",
    title:
      "Attention Is Not All You Need: Sparse Routing for Long-Context Scientific Corpora",
    authors: ["Lina Park", "Diego Alvarez", "Mei Lin"],
    abstract:
      "We introduce a routing transformer that retrieves sparse expert blocks over 128k-token scientific documents without degrading factual consistency. On a new benchmark of open-access monographs, the model reduces memory by 41% while matching dense attention on citation-aware QA.",
    keywords: ["transformers", "sparse attention", "scientific NLP", "long context"],
    field: "Computer Science",
    year: 2025,
    publishedAt: "2025-11-12",
    venue: "Proceedings of NeurIPS",
    venueType: "conference",
    citations: 186,
    pages: "1–18",
    doi: "10.48550/arXiv.2511.08421",
    access: "open",
    addedAt: "2026-08-30",
    reads: 15440,
  },
  {
    _id: "p-ice",
    title: "Rapid Firn Densification on the Antarctic Peninsula, 1992–2024",
    authors: ["Clara Jensen", "Kwame Mensah", "Ingrid Solberg"],
    abstract:
      "Satellite altimetry combined with firn-core measurements shows accelerated densification along the Larsen C catchment. We attribute the signal to meltwater percolation rather than accumulation change, with implications for mass-balance inversion.",
    keywords: ["glaciology", "Antarctica", "remote sensing", "mass balance"],
    field: "Earth Science",
    year: 2024,
    publishedAt: "2024-06-03",
    venue: "Nature Geoscience",
    venueType: "journal",
    citations: 92,
    pages: "511–519",
    doi: "10.1038/s41561-024-01402-1",
    access: "open",
    addedAt: "2026-08-21",
    reads: 11280,
  },
  {
    _id: "p-consent",
    title: "Dynamic Consent Architectures for Multi-Site Genomic Studies",
    authors: ["Helen Cho", "Ravi Mehta", "Sofia Berg"],
    abstract:
      "We present a consent protocol that lets participants revise data-use permissions over time without breaking longitudinal analysis. A deployment across four biobanks reduced withdrawal rates and improved under-represented cohort retention.",
    keywords: ["bioethics", "genomics", "consent", "health data"],
    field: "Medicine",
    year: 2023,
    publishedAt: "2023-09-18",
    venue: "The Lancet Digital Health",
    venueType: "journal",
    citations: 74,
    pages: "e612–e624",
    doi: "10.1016/S2589-7500(23)00144-8",
    access: "members",
    addedAt: "2026-07-14",
    reads: 6310,
  },
  {
    _id: "p-catalog",
    title: "Linked Open Catalogues: A Graph Model for Scholarly Metadata",
    authors: ["Marcus Hale", "Elena Ibarra"],
    abstract:
      "This paper proposes a graph ontology that unifies MARC, Dublin Core, and citation graphs for digital research libraries. We evaluate entity resolution on 2.1 million records and show improved recall for author disambiguation.",
    keywords: ["metadata", "linked data", "digital libraries", "cataloguing"],
    field: "Information Science",
    year: 2022,
    publishedAt: "2022-04-09",
    venue: "Journal of Documentation",
    venueType: "journal",
    citations: 58,
    pages: "220–247",
    doi: "10.1108/JD-04-2022-0081",
    access: "members",
    addedAt: "2026-06-02",
    reads: 4190,
  },
  {
    _id: "p-networks",
    title: "Spectral Clustering Bounds for Sparse Hypergraphs",
    authors: ["Wei Chen", "Ananya Iyer"],
    abstract:
      "We prove non-asymptotic recovery guarantees for hypergraph spectral clustering under a sparse stochastic block model. The analysis tightens existing expander-mixing lemmas and is illustrated on co-authorship networks.",
    keywords: ["spectral graph theory", "hypergraphs", "clustering", "networks"],
    field: "Mathematics",
    year: 2024,
    publishedAt: "2024-02-27",
    venue: "Annals of Statistics",
    venueType: "journal",
    citations: 41,
    pages: "88–121",
    doi: "10.1214/24-AOS2410",
    access: "open",
    addedAt: "2026-08-01",
    reads: 5380,
  },
  {
    _id: "p-cities",
    title: "Fifteen-Minute Cities Without Displacement: Evidence from Bogotá",
    authors: ["Julian Ortega", "Camila Restrepo"],
    abstract:
      "Using mobile traces and cadastral data, we test whether proximity-based planning in Bogotá increased access to amenities without raising rents. Results show amenity gains concentrated near BRT corridors, with limited displacement over five years.",
    keywords: ["urban planning", "accessibility", "housing", "mobility"],
    field: "Architecture",
    year: 2023,
    publishedAt: "2023-10-02",
    venue: "Urban Studies",
    venueType: "journal",
    citations: 36,
    pages: "3014–3036",
    doi: "10.1177/00420980231190218",
    access: "open",
    addedAt: "2026-05-17",
    reads: 4870,
  },
  {
    _id: "p-sahel",
    title: "Drought Narratives and the Politics of Listening in the Western Sahel",
    authors: ["Fatima Diallo"],
    abstract:
      "Drawing on 86 oral-history interviews, this article examines how drought is remembered across generations. It argues that archival listening can counter extractive climate reporting and restore narrative agency to Sahelian communities.",
    keywords: ["oral history", "Sahel", "climate", "ethnography"],
    field: "Anthropology",
    year: 2022,
    publishedAt: "2022-12-11",
    venue: "American Ethnologist",
    venueType: "journal",
    citations: 29,
    pages: "455–472",
    doi: "10.1111/amet.13102",
    access: "members",
    addedAt: "2026-04-09",
    reads: 2760,
  },
  {
    _id: "p-algogov",
    title: "Due Process in Automated Public Benefits: A Comparative Study",
    authors: ["Nadia Petrov", "James Okonkwo"],
    abstract:
      "We compare judicial review of algorithmic welfare decisions in the EU, UK, and Canada. The paper proposes a minimum procedural standard—notice, explanation, and human reconsideration—for automated administrative action.",
    keywords: ["administrative law", "AI governance", "due process", "welfare"],
    field: "Law",
    year: 2024,
    publishedAt: "2024-01-16",
    venue: "Oxford Journal of Legal Studies",
    venueType: "journal",
    citations: 63,
    pages: "1–32",
    doi: "10.1093/ojls/gqad044",
    access: "members",
    addedAt: "2026-07-22",
    reads: 3920,
  },
  {
    _id: "p-dh",
    title: "Critical Data Practices in Literary Archives",
    authors: ["Sarah Blackwell", "Owen MacRae"],
    abstract:
      "This conference paper reports on a TEI encoding project that surfaces colonial absences in a nineteenth-century periodical corpus. We describe community annotation protocols and release a reusable markup schema.",
    keywords: ["digital humanities", "TEI", "archives", "periodicals"],
    field: "Humanities",
    year: 2023,
    publishedAt: "2023-07-07",
    venue: "DH2023 Conference Proceedings",
    venueType: "conference",
    citations: 17,
    pages: "88–96",
    doi: "10.5281/zenodo.8123341",
    access: "open",
    addedAt: "2026-03-28",
    reads: 2140,
  },
  {
    _id: "p-quantum",
    title: "Surface-Code Thresholds under Realistic Leakage Noise",
    authors: ["Elena Voss", "Haruto Saito"],
    abstract:
      "We simulate surface-code logical error rates when qubits leak out of the computational subspace. A leakage-reduction unit restores thresholds near 0.8% for superconducting hardware parameters published in 2024.",
    keywords: ["quantum error correction", "surface code", "leakage", "NISQ"],
    field: "Computer Science",
    year: 2025,
    publishedAt: "2025-03-04",
    venue: "PRX Quantum",
    venueType: "journal",
    citations: 108,
    pages: "010312",
    doi: "10.1103/PRXQuantum.6.010312",
    access: "open",
    addedAt: "2026-08-09",
    reads: 9780,
  },
];

export const members: Member[] = [
  {
    _id: "u-amelia",
    name: "Dr. Amelia Chen",
    email: "a.chen@nextgen.library",
    isMember: true,
    isAdmin: false,
    joinedAt: "2019-09-01",
    reads: 412,
    status: "Active",
  },
  {
    _id: "u-jonas",
    name: "Jonas Adeyemi",
    email: "j.adeyemi@nextgen.library",
    isMember: false,
    isAdmin: false,
    joinedAt: "2024-09-12",
    reads: 86,
    status: "Active",
  },
  {
    _id: "u-leila",
    name: "Leila Haddad",
    email: "l.haddad@nextgen.library",
    isMember: true,
    isAdmin: true,
    joinedAt: "2016-02-03",
    reads: 190,
    status: "Active",
  },
  {
    _id: "u-marco",
    name: "Marco Silva",
    email: "m.silva@nextgen.library",
    isMember: false,
    isAdmin: false,
    joinedAt: "2023-01-18",
    reads: 54,
    status: "Active",
  },
  {
    _id: "u-priya",
    name: "Priya Shah",
    email: "p.shah@nextgen.library",
    isMember: true,
    isAdmin: false,
    joinedAt: "2018-08-20",
    reads: 277,
    status: "Active",
  },
  {
    _id: "u-noah",
    name: "Noah Feldman",
    email: "n.feldman@nextgen.library",
    isMember: false,
    isAdmin: false,
    joinedAt: "2025-09-02",
    reads: 12,
    status: "Invited",
  },
  {
    _id: "u-sofia",
    name: "Sofia Berg",
    email: "s.berg@nextgen.library",
    isMember: true,
    isAdmin: false,
    joinedAt: "2021-03-15",
    reads: 331,
    status: "Active",
  },
  {
    _id: "u-admin",
    name: "Alex Rivera",
    email: "admin@nextgen.library",
    isMember: true,
    isAdmin: true,
    joinedAt: "2015-11-09",
    reads: 48,
    status: "Active",
  },
];

export const currentUser = members[0];

export const userLibrary: UserLibrary = {
  saved: [
    { resourceId: "p-attn", kind: "paper", savedAt: "2026-08-31" },
    { resourceId: "p-quantum", kind: "paper", savedAt: "2026-08-20" },
    { resourceId: "p-consent", kind: "paper", savedAt: "2026-07-19" },
    { resourceId: "p-catalog", kind: "paper", savedAt: "2026-06-08" },
  ],
  history: [
    {
      resourceId: "b-quantum",
      kind: "book",
      lastReadAt: "2026-09-03",
      progress: 62,
    },
    {
      resourceId: "p-attn",
      kind: "paper",
      lastReadAt: "2026-09-02",
      progress: 100,
    },
    {
      resourceId: "b-nlm",
      kind: "book",
      lastReadAt: "2026-08-29",
      progress: 24,
    },
    {
      resourceId: "p-ice",
      kind: "paper",
      lastReadAt: "2026-08-27",
      progress: 40,
    },
    {
      resourceId: "b-networks",
      kind: "book",
      lastReadAt: "2026-08-21",
      progress: 11,
    },
  ],
  favorites: [
    { resourceId: "b-quantum", kind: "book", savedAt: "2026-04-12" },
    { resourceId: "b-climate", kind: "book", savedAt: "2026-08-28" },
    { resourceId: "p-networks", kind: "paper", savedAt: "2026-08-02" },
    { resourceId: "b-knowledge", kind: "book", savedAt: "2026-07-04" },
  ],
};

export const monthlyReads: MonthlyReads[] = [
  { month: "Mar", year: 2026, books: 1840, papers: 960 },
  { month: "Apr", year: 2026, books: 2010, papers: 1120 },
  { month: "May", year: 2026, books: 1760, papers: 1288 },
  { month: "Jun", year: 2026, books: 2214, papers: 1410 },
  { month: "Jul", year: 2026, books: 1988, papers: 1522 },
  { month: "Aug", year: 2026, books: 2430, papers: 1690 },
  { month: "Sep", year: 2026, books: 1288, papers: 844 },
];

export const popularResources: PopularResource[] = [
  { _id: "b-climate", title: "Climate Systems of the Anthropocene", kind: "book", reads: 22110 },
  { _id: "b-nlm", title: "Neural Language Models", kind: "book", reads: 19880 },
  { _id: "b-quantum", title: "Principles of Quantum Computing", kind: "book", reads: 18420 },
  { _id: "p-attn", title: "Sparse Routing for Long-Context Scientific Corpora", kind: "paper", reads: 15440 },
  { _id: "b-dh", title: "Introduction to Digital Humanities", kind: "book", reads: 13650 },
];

export const libraryStats = {
  totalBooks: 12840,
  researchPapers: 5621,
  activeMembers: 1842,
  readsThisMonth: 21320,
};

export const bookCategories = [
  "Computer Science",
  "Information Science",
  "Environmental Science",
  "History",
  "Medicine",
  "Architecture",
  "Mathematics",
  "Anthropology",
  "Humanities",
  "Earth Science",
  "Law",
] as const;

export const researchFields = [
  "Computer Science",
  "Earth Science",
  "Medicine",
  "Information Science",
  "Mathematics",
  "Architecture",
  "Anthropology",
  "Law",
  "Humanities",
] as const;

export function getBook(id: string) {
  return books.find((book) => book._id === id);
}

export function getPaper(id: string) {
  return papers.find((paper) => paper._id === id);
}

export function relatedBooks(book: Book, limit = 4) {
  return books
    .filter((item) => item._id !== book._id && item.category === book.category)
    .concat(books.filter((item) => item._id !== book._id && item.author === book.author))
    .filter((item, index, list) => list.findIndex((entry) => entry._id === item._id) === index)
    .slice(0, limit);
}

export function relatedPapers(paper: ResearchPaper, limit = 3) {
  return papers
    .filter((item) => item._id !== paper._id && item.field === paper.field)
    .concat(
      papers.filter(
        (item) =>
          item._id !== paper._id &&
          item.keywords.some((keyword) => paper.keywords.includes(keyword)),
      ),
    )
    .filter((item, index, list) => list.findIndex((entry) => entry._id === item._id) === index)
    .slice(0, limit);
}

export function recentlyAdded(limit = 6) {
  const mixed = [
    ...books.map((book) => ({ kind: "book" as const, addedAt: book.addedAt, book, paper: undefined })),
    ...papers.map((paper) => ({ kind: "paper" as const, addedAt: paper.addedAt, paper, book: undefined })),
  ];
  return mixed
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
    .slice(0, limit);
}

export function featuredBooks() {
  return books.filter((book) => book.featured);
}

export function latestPapers(limit = 4) {
  return [...papers].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, limit);
}
