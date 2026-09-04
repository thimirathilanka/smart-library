import type { Book, ResearchPaper } from "./types";

export function bookAPA(book: Book) {
  return `${book.author} (${book.year}). ${book.title}${book.subtitle ? `: ${book.subtitle}` : ""}. ${book.publisher}.`;
}

export function bookMLA(book: Book) {
  return `${book.author}. ${book.title}${book.subtitle ? `: ${book.subtitle}` : ""}. ${book.publisher}, ${book.year}.`;
}

export function bookChicago(book: Book) {
  return `${book.author}. ${book.title}${book.subtitle ? `: ${book.subtitle}` : ""}. ${book.publisher}, ${book.year}.`;
}

function authorList(authors: string[]) {
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return `${authors[0]} and ${authors[1]}`;
  return `${authors.slice(0, -1).join(", ")}, and ${authors.at(-1)}`;
}

export function paperAPA(paper: ResearchPaper) {
  return `${authorList(paper.authors)} (${paper.year}). ${paper.title}. ${paper.venue}. https://doi.org/${paper.doi}`;
}

export function paperMLA(paper: ResearchPaper) {
  return `${authorList(paper.authors)}. "${paper.title}." ${paper.venue}, ${paper.year}, pp. ${paper.pages}.`;
}

export function paperChicago(paper: ResearchPaper) {
  return `${authorList(paper.authors)}. "${paper.title}." ${paper.venue} (${paper.year}): ${paper.pages}.`;
}
