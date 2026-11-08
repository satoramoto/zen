import { useEffect, useState } from 'react';
import { Button } from '../../../components/core/Button/Button';
import { focusRing } from '../../../primitives/Ring';
import { Stack } from '../../../primitives/Stack';
import { Surface } from '../../../primitives/Surface';
import { Text } from '../../../primitives/Text';
import { bookIndex, chapterOf, chapterProgress, neighbours, type Book as BookData } from '../../model/book';
import { unitSuffix, type Quantity } from '../../model/document';
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

const decimals = (step: number) => Math.max(0, Math.min(6, -Math.floor(Math.log10(step))));
const shown = (q: Quantity) => `${q.value.toFixed(decimals(q.step ?? 1))}${unitSuffix(q.unit)}`;

/**
 * **Job.** A book to the textbook's lock: a ruled ledger of its chapters down the side (number,
 * title, exercises done), the open chapter's quantities under it with their live values, the open
 * chapter as a `Document` with its plate, and a pager under that. Peeks resolve across the whole
 * book (its chapters' heads and its glossary). Progress and the open chapter are the book's
 * state; a host that wants them kept gets them through `onProgress` and `onChapter`. Below a
 * narrow width the ledger folds above the chapter.
 */
export function Book({ book, figures, checkers, initial, progress: initialProgress = {}, onProgress, onChapter }: BookProps) {
  const [current, setCurrent] = useState(() => chapterOf(book, initial).id);
  const [progress, setProgress] = useState<Progress>(initialProgress);
  const [quantities, setQuantities] = useState<Record<string, Quantity>>({});
  const chapter = chapterOf(book, current);
  const number = book.chapters.indexOf(chapter) + 1;
  const { previous, next } = neighbours(book, chapter.id);
  const index = bookIndex(book);
  const turn = (id: string) => {
    setCurrent(id);
    setQuantities({});
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
  const live = { ...chapter.quantities, ...quantities };
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
          <Stack gap={5}>
            <Stack gap={1}>
              <Text as="p" role="heading" size="body" weight="strong" tone="primary">
                {book.title}
              </Text>
              {book.subtitle && (
                <Text as="p" role="caption" tone="muted">
                  {book.subtitle}
                </Text>
              )}
            </Stack>
            <div className="cmp-book__ledger">
              <div className="cmp-book__row cmp-book__row--head" aria-hidden="true">
                <Text role="label" size="caption" tone="muted" className="cmp-book__cell">
                  Chapters
                </Text>
                <Text role="label" size="caption" tone="muted">
                  Done
                </Text>
              </div>
              <ol className="cmp-book__list">
                {book.chapters.map((c, i) => {
                  const p = chapterProgress(c, progress);
                  const open = c.id === chapter.id;
                  return (
                    <li key={c.id} className="cmp-book__row">
                      <Text
                        as="button"
                        type="button"
                        role="body"
                        size="caption"
                        tone={open ? 'primary' : 'secondary'}
                        weight={open ? 'strong' : undefined}
                        className={`cmp-book__chapter ${focusRing}`}
                        aria-current={open ? 'page' : undefined}
                        onClick={() => turn(c.id)}
                      >
                        <Text role="numeral" size="caption" tone={open ? 'accent' : 'muted'} tabular className="cmp-book__number">
                          {i + 1}
                        </Text>
                        <span className="cmp-book__title">{c.title}</span>
                      </Text>
                      <Text role="numeral" size="caption" tone={p.total > 0 && p.done === p.total ? 'success' : 'muted'} tabular className="cmp-book__progress" aria-label={`${p.done} of ${p.total} exercises done`}>
                        {p.total > 0 ? `${p.done}/${p.total}` : '—'}
                      </Text>
                    </li>
                  );
                })}
              </ol>
            </div>
            {Object.keys(live).length > 0 && (
              <div className="cmp-book__ledger" aria-label="In this chapter">
                <div className="cmp-book__row cmp-book__row--head" aria-hidden="true">
                  <Text role="label" size="caption" tone="muted">
                    In this chapter
                  </Text>
                  <span />
                </div>
                <dl className="cmp-book__list">
                  {Object.entries(live).map(([name, q]) => (
                    <div key={name} className="cmp-book__row">
                      <Text as="dt" role="body" size="caption" tone="secondary" className="cmp-book__title">
                        {q.label ?? name}
                      </Text>
                      <Text as="dd" role="numeral" size="caption" tone="primary" tabular className="cmp-book__progress" data-quantity={name}>
                        {shown(q)}
                      </Text>
                    </div>
                  ))}
                </dl>
              </div>
            )}
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
            onQuantities={setQuantities}
            chapter={{ number, of: book.chapters.length, book: book.title }}
            footer={pager}
          />
        </div>
      </div>
    </Surface>
  );
}
