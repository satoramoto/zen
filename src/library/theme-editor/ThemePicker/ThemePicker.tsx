import { useId, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { Mode } from '../../contract';
import type { ModeChoice } from '../../theme';
import { packs } from '../../themes/packs';
import { Button } from '../../components/core/Button/Button';
import { Toggle } from '../../components/core/Toggle/Toggle';
import { LineSlider } from '../../components/core/LineSlider/LineSlider';
import { focusRing } from '../../primitives/Ring';
import { Stack } from '../../primitives/Stack';
import { Text } from '../../primitives/Text';
import { SkinScope } from '../SkinScope';
import { isCustom, resolveSkin, skinFromPack, type Skin } from '../skin';
import './ThemePicker.css';

interface Entry {
  key: string;
  skin: Skin;
  label: string;
  note: string;
}

/** The light/dark mode of the nearest `ThemeScope` around `el`, read from its `data-mode`. */
function hostModeOf(el: HTMLElement | null): Mode | undefined {
  const m = el?.parentElement?.closest('.lib-scope')?.getAttribute('data-mode');
  return m === 'light' || m === 'dark' ? m : undefined;
}

/** A small live specimen of a skin: real controls, drawn in the skin's own scope, not interactive. */
function Preview({ skin, mode }: { skin: Skin; mode: ModeChoice }) {
  const { pack } = useMemo(() => resolveSkin(skin), [skin]);
  const desktop = mode === 'system' ? undefined : pack.desktop?.[mode];
  return (
    // A translucent ground shows the pack's stand-in desktop through it, as in Storybook.
    <div className="zen-theme-picker__frame" data-part="frame" style={desktop ? { background: desktop } : undefined} inert aria-hidden="true">
      <SkinScope skin={skin} mode={mode} bleed>
        <Stack className="zen-theme-picker__specimen" gap={2} wrap>
          <Text role="display" size="heading" leading="tight" truncate className="zen-theme-picker__title">
            {pack.label}
          </Text>
          <Text role="body" tone="secondary" truncate>
            Quiet type, clear controls.
          </Text>
          {/* The colours first: a larger scale clips the last row, never the palette. */}
          <span className="zen-theme-picker__swatches" data-part="swatches">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className="zen-theme-picker__swatch" data-hue={n} />
            ))}
            <span className="zen-theme-picker__swatch" data-hue="accent" />
          </span>
          <Stack direction="row" gap={2} align="center">
            <Button label="Play" variant="primary" />
            <Button label="Stop" variant="secondary" />
          </Stack>
          <Stack direction="row" gap={3} align="center">
            <Toggle on onChange={() => {}} label="Sample toggle" width={40}>
              On
            </Toggle>
            <LineSlider value={64} name="Sample level" width={64} />
          </Stack>
        </Stack>
      </SkinScope>
    </div>
  );
}

/**
 * Every theme pack as a live preview, to choose one.
 *
 * **Job.** Pick the skin a scope wears, by seeing each pack's own ground, faces, scale and
 * materials on real controls rather than reading its name. A skin that differs from its pack
 * (`isCustom`) comes first, as "based on" its pack, so choosing a pack never loses it from view.
 *
 * **Behaviour.** A `radiogroup` ("Theme") of `radio` entries with a roving tabindex: only the
 * chosen entry takes Tab. ← → move and choose (wrapping), ↑ ↓ move a row of the grid, Home / End
 * the first and last; Enter, Space or a click choose. Choosing a pack calls
 * `onChange(skinFromPack(pack))`; choosing the custom entry hands back that custom skin. The
 * picker remembers the last custom skin it was given, so it stays listed after a pack is chosen.
 * Each preview is drawn in its own `SkinScope` in `mode` (default: the host scope's mode), `inert`
 * and hidden from assistive tech: the entry is named by its label and described by the pack's
 * north star.
 *
 * **Parts.** `root` (the radiogroup, a grid that fills its width with as many columns as fit),
 * `entry` (each radio, `aria-checked`), `frame` (the preview at a fixed aspect, ringed in
 * `--selected` when chosen), `swatches` (the five hues and the accent), `label`, `note`.
 */
export function ThemePicker({ value, onChange, mode, className }: { value: Skin; onChange(skin: Skin): void; mode?: ModeChoice; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const [hostMode, setHostMode] = useState<Mode | undefined>(undefined);
  useLayoutEffect(() => {
    const m = hostModeOf(root.current);
    if (m !== hostMode) setHostMode(m);
  });
  const wear: ModeChoice = mode ?? hostMode ?? 'system';

  // The last custom skin seen, so choosing a pack doesn't drop it from the list.
  const [kept, setKept] = useState<Skin | null>(() => (isCustom(value) ? value : null));
  if (isCustom(value) && kept !== value) setKept(value);
  const custom = isCustom(value) ? value : kept;

  const entries = useMemo<Entry[]>(() => {
    const list: Entry[] = packs.map((p) => ({ key: `pack:${p.id}`, skin: skinFromPack(p), label: p.label, note: p.northStar }));
    if (custom) {
      const base = packs.find((p) => p.id === custom.base);
      list.unshift({ key: 'custom', skin: custom, label: custom.label, note: `based on ${base?.label ?? custom.base}` });
    }
    return list;
  }, [custom]);

  const checked = isCustom(value) ? 0 : entries.findIndex((e) => e.key === `pack:${value.base}`);
  const tabStop = checked < 0 ? 0 : checked;

  const choose = (at: number) => {
    const e = entries[at];
    if (e) onChange(e.skin);
  };

  const focusAt = (at: number) => root.current?.querySelectorAll<HTMLElement>('[data-part="entry"]')[at]?.focus();

  /** How many entries sit on the first row of the grid. */
  const columns = () => {
    const items = root.current?.querySelectorAll<HTMLElement>('[data-part="entry"]');
    if (!items?.length) return 1;
    const top = items[0].offsetTop;
    let n = 0;
    for (const it of items) if (it.offsetTop === top) n++;
    return Math.max(1, n);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const from = Number((e.target as HTMLElement).closest<HTMLElement>('[data-part="entry"]')?.dataset.index ?? tabStop);
    const last = entries.length - 1;
    let to: number | undefined;
    if (e.key === 'ArrowRight') to = from === last ? 0 : from + 1;
    else if (e.key === 'ArrowLeft') to = from === 0 ? last : from - 1;
    else if (e.key === 'ArrowDown') to = Math.min(last, from + columns());
    else if (e.key === 'ArrowUp') to = Math.max(0, from - columns());
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = last;
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(from);
      return;
    }
    if (to === undefined) return;
    e.preventDefault();
    focusAt(to);
    if (to !== checked) choose(to);
  };

  return (
    <div
      ref={root}
      className={`zen-theme-picker${className ? ` ${className}` : ''}`}
      data-part="root"
      role="radiogroup"
      aria-label="Theme"
      onKeyDown={onKeyDown}
    >
      {entries.map((entry, at) => {
        const on = at === checked;
        const noteId = `${id}-${at}-note`;
        return (
          <div
            key={entry.key}
            className={`zen-theme-picker__entry ${focusRing}`}
            data-part="entry"
            data-index={at}
            role="radio"
            aria-checked={on}
            aria-label={entry.label}
            aria-describedby={noteId}
            tabIndex={at === tabStop ? 0 : -1}
            onClick={() => choose(at)}
          >
            <Preview skin={entry.skin} mode={wear} />
            <span className="zen-theme-picker__caption">
              <Text role="body" weight="strong" truncate tone={on ? 'primary' : 'secondary'} className="zen-theme-picker__label" data-part="label">
                {entry.label}
              </Text>
              <Text role="caption" tone="muted" truncate className="zen-theme-picker__note" data-part="note" id={noteId}>
                {entry.note}
              </Text>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default ThemePicker;
