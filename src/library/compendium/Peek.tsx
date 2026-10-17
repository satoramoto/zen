import { useCallback, useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { focusRing } from '../primitives/Ring';
import { Popover } from '../components/core/Popover/Popover';
import { Stack } from '../primitives/Stack';
import { Text } from '../primitives/Text';
import { Mark, type Standing } from './Mark';
import './Peek.css';

/** What a peek shows of another entry. */
export interface PeekEntry {
  title: string;
  /** One or two sentences. */
  summary: string;
  /** The entry's kind, e.g. "Concept", "Tuning system". */
  kind?: string;
  standing?: Standing;
}

export interface PeekProps {
  entry: PeekEntry;
  /** The words in the text; default the entry's title. */
  children?: ReactNode;
}

/** How long a hover rests before the preview opens, and how long it waits before closing. */
const OPEN_DELAY = 350;
const CLOSE_DELAY = 200;

/**
 * **Job.** (Compendium mockup stub.) An inline mention of another entry with a preview: a `Popover`
 * hung off the words. A hover that rests opens it and leaving both the words and the panel
 * closes it; a tap or click toggles it (touch has no hover); Escape and a press elsewhere close
 * it (the Popover's own dismissal). The words are a button, so it is reachable by keyboard.
 */
export function Peek({ entry, children }: PeekProps) {
  const anchor = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const id = useId();
  const later = (fn: () => void, ms: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(fn, ms);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const dismiss = useCallback(() => setOpen(false), []);
  const hoverIn = (e: PointerEvent) => e.pointerType === 'mouse' && later(() => setOpen(true), OPEN_DELAY);
  const hoverOut = (e: PointerEvent) => e.pointerType === 'mouse' && later(() => setOpen(false), CLOSE_DELAY);
  return (
    <>
      <Text
        as="button"
        type="button"
        size="inherit"
        tone="accent"
        className={`cmp-peek ${focusRing}`}
        ref={anchor}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => {
          window.clearTimeout(timer.current);
          setOpen((o) => !o);
        }}
        onPointerEnter={hoverIn}
        onPointerLeave={hoverOut}
      >
        {children ?? entry.title}
      </Text>
      {open &&
        anchor.current &&
        // The Popover's root is a div, which may not sit in a paragraph: portal it into the theme
        // scope around the words, so the theme's variables still reach it.
        createPortal(
        <Popover anchor={anchor} onDismiss={dismiss} label={entry.title} id={id} role="dialog" className="cmp-peek__panel">
          <div
            onPointerEnter={(e) => e.pointerType === 'mouse' && window.clearTimeout(timer.current)}
            onPointerLeave={hoverOut}
          >
            <Stack gap={2}>
              <Stack direction="row" gap={2} align="center">
                {entry.standing && <Mark standing={entry.standing} place="inline" />}
                <Text role="label" tone="muted">
                  {entry.kind ?? 'Entry'}
                </Text>
              </Stack>
              <Text role="heading" size="body" weight="strong" tone="primary">
                {entry.title}
              </Text>
              <Text as="p" role="body" size="caption" tone="secondary">
                {entry.summary}
              </Text>
            </Stack>
          </div>
        </Popover>,
          anchor.current.closest('.lib-scope') ?? document.body,
        )}
    </>
  );
}
