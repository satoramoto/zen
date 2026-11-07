import { useEffect, useState } from 'react';
import { Button } from '../../../components/core/Button/Button';
import { focusRing } from '../../../primitives/Ring';
import { Stack } from '../../../primitives/Stack';
import { Surface } from '../../../primitives/Surface';
import { Text } from '../../../primitives/Text';
import { bookIndex, chapterOf, chapterProgress, neighbours, type Book as BookData } from '../../model/book';
import type { CheckerRegistry, Progress } from '../../model/exercise';
import { Document, type FigureRegistry } from '../Document/Document';
import './Book.css';

export interface BookProps {
  book: BookData;
  figures?: FigureRegistry;
  checkers?: CheckerRegistry;
  /** The chapter open at first; default the first. */
  initial?: string;
  /** Progress to start from, by `<chapter id>/<exercise id>`. */
  progress?: Progress;
  /** Called with the whole progress each time an exercise is done, so the host can keep it. */
  onProgress?(progress: Progress): void;
  /** Called when the reader turns to a chapter. */
  onChapter?(id: string): void;
}

/**
 * **Job.** A book: its contents down the side, the open chapter as a `Document`, and a pager
 * under it. The contents show each chapter's exercises done out of its total; peeks resolve
 * across the whole book (its chapters' heads and its glossary). Progress and the open chapter
 * are the book's state; a host that wants them kept gets them through `onProgress` and
 * `onChapter`. Below a narrow width the contents fold above the chapter.
 */
export function Book({ book, figures, checkers, initial, progress: initialProgress = {}, onProgress, onChapter }: BookProps) {
  const [current, setCurrent] = useState(() => chapterOf(book, initial).id);
  const [progress, setProgress] = useState<Progress>(initialProgress);
  const chapter = chapterOf(book, current);
  const { previous, next } = neighbours(book, chapter.id);
  const index = bookIndex(book);
  const turn = (id: string) => {
    setCurrent(id);
    onChapter?.(id);
  };
  useEffect(() => {
    document.getElementById(`cmp-book-${book.id}`)?.scrollTo({ top: 0 });
  }, [current, book.id]);
  const done = (key: string) =>
    setProgress((p) => {
      if (p[key]) return p;
      const nextProgress = { ...p, [key]: true };
      onProgress?.(nextProgress);
      return nextProgress;
    });
  const pager = (
    <Stack direction="row" gap={3} justify="between" wrap className="cmp-book__pager" aria-label="Chapters">
      <div>{previous && <Button label={`← ${previous.title}`} variant="secondary" onPress={() => turn(previous.id)} />}</div>
      <div>{next && <Button label={`${next.title} →`} onPress={() => turn(next.id)} />}</div>
    </Stack>
  );
  return (
    <Surface layer="base" radius="none" className="cmp-book" data-book={book.id}>
     <div className="cmp-book__grid">
      <Surface as="nav" layer="ground" radius="none" className="cmp-book__contents" aria-label="Contents">
        <Stack gap={4}>
          <Stack gap={1}>
            <Text role="label" tone="muted">
              Contents
            </Text>
            <Text as="p" role="heading" size="body" weight="strong" tone="primary">
              {book.title}
            </Text>
            {book.subtitle && (
              <Text as="p" role="caption" tone="secondary">
                {book.subtitle}
              </Text>
            )}
          </Stack>
          <Stack as="ol" gap={1} className="cmp-book__list">
            {book.chapters.map((c, i) => {
              const p = chapterProgress(c, progress);
              const open = c.id === chapter.id;
              return (
                <li key={c.id}>
                  <Text
                    as="button"
                    type="button"
                    role="body"
                    size="caption"
                    tone={open ? 'primary' : 'secondary'}
                    className={`cmp-book__chapter ${focusRing}`}
                    aria-current={open ? 'page' : undefined}
                    onClick={() => turn(c.id)}
                  >
                    <Text role="numeral" size="caption" tone="muted" tabular className="cmp-book__number">
                      {i + 1}
                    </Text>
                    <span className="cmp-book__title">{c.title}</span>
                    {p.total > 0 && (
                      <Text role="numeral" size="caption" tone={p.done === p.total ? 'success' : 'muted'} tabular className="cmp-book__progress" aria-label={`${p.done} of ${p.total} exercises done`}>
                        {p.done}/{p.total}
                      </Text>
                    )}
                  </Text>
                </li>
              );
            })}
          </Stack>
        </Stack>
      </Surface>
      <div className="cmp-book__page" id={`cmp-book-${book.id}`}>
        <Document
          entry={chapter}
          figures={figures}
          entries={index}
          checkers={checkers}
          progress={progress}
          onProgress={done}
          crumb={`${book.title} · Chapter ${book.chapters.indexOf(chapter) + 1}`}
          footer={pager}
        />
      </div>
     </div>
    </Surface>
  );
}
