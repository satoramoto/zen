// A book: entries in reading order, and the heads of entries it mentions but doesn't contain.
import { exercisesIn, type Entry, type EntryHead } from './document';
import type { Progress } from './exercise';

export interface Book {
  id: string;
  title: string;
  /** One line under the title. */
  subtitle?: string;
  /** The chapters, in order. */
  chapters: Entry[];
  /** Entries the chapters peek at that aren't chapters: a glossary. */
  heads?: Record<string, EntryHead>;
}

/** Every entry a page in the book can peek at: the chapters' heads, then the glossary. */
export function bookIndex(book: Book): Record<string, EntryHead> {
  const index: Record<string, EntryHead> = {};
  for (const c of book.chapters) index[c.id] = { title: c.title, kind: c.kind, standing: c.standing, summary: c.summary };
  return { ...index, ...book.heads };
}

/** The chapter with `id`, or the first chapter when there is none. */
export function chapterOf(book: Book, id: string | undefined): Entry {
  return book.chapters.find((c) => c.id === id) ?? book.chapters[0];
}

/** The chapters either side of `id`. */
export function neighbours(book: Book, id: string): { previous?: Entry; next?: Entry } {
  const i = book.chapters.findIndex((c) => c.id === id);
  return { previous: i > 0 ? book.chapters[i - 1] : undefined, next: i >= 0 && i < book.chapters.length - 1 ? book.chapters[i + 1] : undefined };
}

/** How many of a chapter's exercises are done, and how many there are. */
export function chapterProgress(entry: Entry, progress: Progress): { done: number; total: number } {
  const exercises = exercisesIn(entry);
  return { done: exercises.filter((e) => progress[`${entry.id}/${e.id}`]).length, total: exercises.length };
}

/** The key progress is kept under: the exercise's id, scoped to its chapter. */
export const progressKey = (entry: Entry, exerciseId: string) => `${entry.id}/${exerciseId}`;
