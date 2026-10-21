export const STANDARD_TOPICS = [
  "Anthropology",
  "Architecture & Urban Design",
  "Artificial Intelligence",
  "Biology & Life Sciences",
  "Chemistry",
  "Computer Science",
  "Earth & Planetary Science",
  "Economics & Finance",
  "Engineering",
  "Environmental Science",
  "Folk Tales & Folklore",
  "History",
  "Humanities",
  "Information Science",
  "Laboratory & Experimental Sciences",
  "Law & Public Policy",
  "Literature & Fiction",
  "Mathematics",
  "Medicine & Health",
  "Philosophy & Ethics",
  "Physics",
  "Political Science",
  "Psychology",
  "Sociology",
] as const;

export type StandardTopic = (typeof STANDARD_TOPICS)[number];

