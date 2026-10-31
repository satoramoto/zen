// SectionBar's model: a song's sections in order, the one playing and the one queued, and the tree
// both renderers draw from them. No framework: `SectionBar.tsx` and `SectionBar.svelte` both pass
// `sectionBarView` and `sectionBarHandlers` to their `Tree`. A section cell is PushTwin's row-7 cell
// (`../sections.ts`): the bar is that row drawn as the song's form. It holds no state: a press only
// asks `onSection` with the section's id. Playing, queued, when a change lands (on the phrase, on
// the bar) and what a FILL or a variation does are the host's to say; the host's `hint` says it.
import { each, h, styleText, when, wire, type Handlers, type Node } from '../../../view/Tree.model';
import { liveHead, livePane, liveReading } from '../live.model';
import { SECTION_WORD, sectionLabel, sectionState, type SectionCellState } from '../sections';
import type { SectionBarForm } from './SectionBar.forms';

/** One section of the song. */
export interface LiveSection {
  /** What `onSection` carries. Unique in the song. */
  id: string;
  /** `'VERSE'`, `'FILL'`. */
  name: string;
  /** Its length in bars. Left out: free, no fixed length. */
  bars?: number;
  /** How many times it plays through: `2` reads `×2`. */
  repeat?: number;
  /** It plays until moved on from, whatever its length. */
  open?: boolean;
  /** False: the host can't launch it now. Drawn, not pressable; `reason` says why. */
  available?: boolean;
  reason?: string;
}

export interface SectionBarProps {
  /** The song's sections, in order. */
  sections: readonly LiveSection[];
  /** The id of the section playing. */
  current?: string;
  /** The id of the section the host has queued next. */
  queued?: string;
  /** The host's word on when a change lands: `'change on phrase'`. Shown, never acted on. */
  hint?: string;
  /** A section was pressed: ask the host to go there. Without it the bar is read-only. */
  onSection?: (id: string) => void;
  /** Draw this form outside an assembled screen (a screen's own choice wins inside one). */
  form?: SectionBarForm;
  className?: string;
}

/** A section's length caption: `16 bars · ×2`, `16 bars · open`, `free`. */
export function lengthText({ bars, repeat, open }: LiveSection): string {
  const base = bars === undefined || !Number.isFinite(bars) ? 'free' : `${bars} ${bars === 1 ? 'bar' : 'bars'}`;
  const times = repeat !== undefined && repeat > 1 ? ` · ×${repeat}` : '';
  return `${base}${times}${open ? ' · open' : ''}`;
}

/** A section's share of the `bars` form's width: its bars (a free section a short one's), never below four, so every cell stays a target. */
const share = (s: LiveSection): number => Math.max(4, s.bars !== undefined && Number.isFinite(s.bars) ? s.bars * (s.repeat ?? 1) : 4);

function cell(s: LiveSection, state: SectionCellState, inert: boolean, form: SectionBarForm): Node {
  const unavailable = s.available === false;
  const label = `${sectionLabel(s.name, state)}${unavailable ? `, unavailable${s.reason ? `: ${s.reason}` : ''}` : ''}`;
  return wire(
    h(
      'button',
      {
        class: 'live-cell live-sections-cell',
        type: 'button',
        'data-part': 'section',
        'data-section': s.id,
        'data-state': state,
        'data-unavailable': unavailable ? 'true' : undefined,
        'aria-current': state === 'on' ? 'true' : undefined,
        'aria-label': label,
        disabled: inert || unavailable ? '' : undefined,
        style: form === 'bars' ? styleText({ '--live-sections-share': String(share(s)) }) : undefined,
      },
      h('span', { class: 'live-sections-name', 'data-part': 'name' }, s.name),
      when(form === 'bars', () => h('span', { class: 'live-sections-length', 'data-part': 'length' }, lengthText(s))),
      when(state === 'queued', () => h('span', { class: 'live-sections-tag', 'aria-hidden': 'true' }, SECTION_WORD.queued)),
    ),
    { on: { click: `section:${s.id}` } },
  );
}

/**
 * The tree SectionBar draws. `bars`: the head (the host's hint) over one row of section cells, each
 * as wide as its bars, its name over its length. `row`: equal cells, the names alone (PushTwin's
 * row 7). `chip`: one status line, the section playing and the one queued, nothing to press.
 * `form` is the binding's (`useForm` / `getForm`).
 */
export function sectionBarView({ sections, current, queued, hint, onSection, className }: SectionBarProps, form: SectionBarForm): Node {
  const inert = onSection === undefined;
  const playing = sections.find((s) => s.id === current);
  const next = sections.find((s) => s.id === queued && s.id !== current);
  if (form === 'chip') {
    const text = playing ? `${playing.name}${next ? ` → ${next.name}` : ''}` : next ? `→ ${next.name}` : sections.length ? 'no section playing' : 'no sections';
    return livePane(
      'sections',
      { class: className, 'data-form': form, role: 'status', 'aria-label': playing ? `${playing.name} playing${next ? `, ${next.name} queued` : ''}` : text },
      h('span', { class: 'live-sections-chip', 'data-part': 'chip' }, text),
      when(hint !== undefined, () => liveReading(hint!)),
    );
  }
  return livePane(
    'sections',
    { class: className, 'data-form': form, 'data-inert': inert ? 'true' : undefined, role: 'group', 'aria-label': 'Sections' },
    when(form === 'bars', () => liveHead({ title: 'Sections', sub: inert ? 'read-only' : undefined, aside: hint })),
    sections.length === 0
      ? h('div', { class: 'live-sections-empty', 'data-part': 'empty' }, h('span', { class: 'live-axis' }, 'No sections'))
      : h(
          'div',
          { class: 'live-sections-cells', 'data-part': 'cells', style: styleText({ '--live-sections-count': String(sections.length) }) },
          ...each(sections, (s) => s.id, (s) => cell(s, sectionState(true, s.id === current, s.id === queued && s.id !== current), inert, form)),
        ),
  );
}

/** The callbacks the tree names: one per section (`section:<id>`), carrying its id. */
export function sectionBarHandlers({ sections, onSection }: SectionBarProps): Handlers {
  const handlers: Handlers = {};
  for (const s of sections) handlers[`section:${s.id}`] = () => {
    if (s.available !== false) onSection?.(s.id);
  };
  return handlers;
}
