import type { CSSProperties, ReactNode } from 'react';
import './GroupHeader.css';

export interface GroupHeaderProps {
  /** The group's name, the heading's text ("Faders"). */
  title: string;
  /** A word that qualifies the title, drawn after it as " · {detail}" ("Faders · Reverb"). */
  detail?: string;
  /** The page counter at the right end ("Page 1/6"). */
  count?: { label: string; value: string };
  /** The heading level of the title. */
  level?: 2 | 3 | 4;
  /** The id put on the heading, for the parent's `aria-labelledby`. */
  id?: string;
  /** A fixed width in px (the band's 646, 610, 88). Default: fills its container. */
  width?: number;
  /** What follows the title (the group's tabs, a page block); each top-level element is a row item. */
  children?: ReactNode;
  /** What sits at the row's right end, before the counter: the header's part legend (HueLegend), if it has one. */
  end?: ReactNode;
}

/**
 * The row that names a group of controls ("Faders", "Knobs", "Pads", "Transport", "Tempo") and
 * holds the group's page tabs, its legend and its page counter. Not a control: no click or
 * focus of its own.
 *
 * **Job**: tell a player where one group of controls starts and which page of it they're on,
 * without competing with the controls themselves.
 *
 * **Changed**: the title now follows the theme's label case with a small positive tracking, so
 * it reads as the group's label in caps packs and stays sentence case elsewhere (hierarchy;
 * `references/typography.md` §8, the all-caps and small-text tracking rules). It is set in
 * `--weight-strong` at the label size; the detail ("Reverb") drops to `--text-2` at body weight,
 * and the counter's word to `--text-3` while its value stays in `--text-1` with tabular
 * numerals, so "Page 1/6" → "2/6" changes a glyph without moving (numerals; `references/
 * typography.md` §10). Space is shared by need: the title never shrinks, the detail truncates
 * first with its full text kept on hover, then the middle content gives way, and the legend and
 * counter stay whole at the right end (`references/typography.md` §10, content overflow). The
 * rule under the row is `--border-strong` at `--border-width`, so it follows the chrome: a hairline
 * in flat packs, never a coloured bar (`references/color.md`: colour only where it is the
 * information, which here is the part legend in `end`; sections take no hue, so a header never
 * keys them). One baseline, set by a strut, still runs
 * through the title, the tabs, the legend and the counter.
 *
 * **Kept**: a real heading at the given level and `id`; `children` straight after the title as
 * row items; `end` as the one place a legend goes, before the counter; "Page 1/6" as one text
 * run; the row's fixed height and its optional fixed width.
 */
export function GroupHeader({ title, detail, count, level = 2, id, width, children, end }: GroupHeaderProps) {
  const Heading = `h${level}` as 'h2' | 'h3' | 'h4';
  const style: CSSProperties | undefined = width === undefined ? undefined : { width: `${width}px` };
  return (
    <div className="yh-group-header" style={style}>
      <Heading className="yh-group-header__title" id={id} title={detail ? `${title} · ${detail}` : undefined}>
        <span className="yh-group-header__name">{title}</span>
        {detail && (
          <>
            {' '}
            <span className="yh-group-header__sep">·</span>{' '}
            <span className="yh-group-header__detail">{detail}</span>
          </>
        )}
      </Heading>
      {children !== undefined && children !== null && <div className="yh-group-header__body">{children}</div>}
      {end !== undefined && end !== null && <span className="yh-group-header__end">{end}</span>}
      {count && (
        <span className="yh-group-header__count">
          {count.label} <span className="yh-group-header__value">{count.value}</span>
        </span>
      )}
    </div>
  );
}
