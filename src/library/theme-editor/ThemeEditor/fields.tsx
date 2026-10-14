// The editor's rows: a labelled row, a colour row (swatch, hex, H/S/L), a field for a CSS length
// held as text ('6px', '-0.01em', '180deg', '70%'), and the head every facet tab starts with.
import { useId, useRef, useState, type ReactNode } from 'react';
import { Text } from '../../primitives/Text';
import { Stack } from '../../primitives/Stack';
import { Button } from '../../components/core/Button/Button';
import { NumberField } from '../../components/core/NumberField/NumberField';
import { Select } from '../../components/core/Select/Select';
import type { Param } from '../../components/core/Param/param';
import { FROM_THEME } from '../../resolve';
import { packs } from '../../themes/packs';
import { hexToHsl, hslToHex, isHex, type Hsl } from '../colour';
import { FACET_LISTS, clearOverride, getOverride, resetFacet, setOverride, swapFacet, type FacetName, type OverridePath, type Skin } from '../skin';

/** One setting: its name in the label column, its controls after it (under it when narrow). */
export function Row({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={`zen-theme-editor__row${className ? ` ${className}` : ''}`} role="group" aria-labelledby={id} data-part="row">
      <Text role="body" size="label" tone="secondary" truncate id={id} title={label} className="zen-theme-editor__row-label" data-part="row-label">
        {label}
      </Text>
      <Stack direction="row" gap={2} align="center" wrap className="zen-theme-editor__row-control" data-part="row-control">
        {children}
      </Stack>
    </div>
  );
}

/** An int field's parameter: `pattern` spells the reading (`'H %d'`, `'%d px'`). */
export const intParam = (min: number, max: number, defaultValue: number, pattern: string, step = 1): Param => ({
  kind: 'int',
  min,
  max,
  defaultValue: Math.max(min, Math.min(max, defaultValue)),
  steps: step === 1 ? undefined : Math.round((max - min) / step) + 1,
  unit: 'custom',
  customUnit: pattern,
});

/** A float field's parameter in `step`s, read with as many decimals as the step has. */
export const floatParam = (min: number, max: number, defaultValue: number, step: number, unit: string): Param => {
  const decimals = Math.max(0, (String(step).split('.')[1] ?? '').length);
  return {
    kind: 'float',
    min,
    max,
    defaultValue: Math.max(min, Math.min(max, defaultValue)),
    steps: Math.round((max - min) / step) + 1,
    unit: 'custom',
    customUnit: `%0.${decimals}f${unit ? ` ${unit}` : ''}`,
  };
};

/** The number in a CSS length with exactly this unit (`'6px'` → 6), or `undefined` (`'normal'`, `'var(--bloom)'`). */
export function lengthOf(raw: unknown, unit: string): number | undefined {
  if (typeof raw !== 'string') return undefined;
  const m = /^\s*(-?\d*\.?\d+)\s*([a-z%]*)\s*$/i.exec(raw);
  if (!m) return undefined;
  const n = Number.parseFloat(m[1]);
  // A bare 0 is a length in every unit.
  if (m[2] === unit || (m[2] === '' && n === 0)) return n;
  return undefined;
}

const roundTo = (v: number, step: number) => {
  const decimals = Math.max(0, (String(step).split('.')[1] ?? '').length);
  return Number(v.toFixed(decimals));
};

/**
 * A CSS length held as text, edited as a number in `unit`. A value the field can't hold (another
 * unit, a keyword, an expression, or beyond its range) is shown as it is until it is changed.
 */
export function LengthField({
  label,
  raw,
  base,
  unit,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  raw: unknown;
  /** The base's value, where a double-click resets to. */
  base: unknown;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange(next: string): void;
}) {
  const n = lengthOf(raw, unit);
  const held = n !== undefined && n >= min && n <= max;
  const baseN = lengthOf(base, unit) ?? min;
  const param = Number.isInteger(step) && step === 1 ? intParam(min, max, baseN, `%d ${unit}`) : floatParam(min, max, baseN, step, unit);
  const field = (
    <NumberField
      param={param}
      value={held ? n : Math.max(min, Math.min(max, n ?? baseN))}
      display={held ? undefined : '—'}
      label={label}
      name=""
      showFill={false}
      onChange={(v) => onChange(`${roundTo(v, step)}${unit}`)}
    />
  );
  if (held) return field;
  return (
    <>
      {field}
      <Text role="code" tone="secondary" truncate title={String(raw)} className="zen-theme-editor__raw">
        {String(raw)}
      </Text>
    </>
  );
}

/** A plain number field (a scale step, a weight). */
export function NumberRowField({ label, value, base, min, max, pattern, step = 1, onChange }: { label: string; value: number; base: number; min: number; max: number; pattern: string; step?: number; onChange(next: number): void }) {
  return <NumberField param={intParam(min, max, base, pattern, step)} value={value} label={label} name="" showFill={false} onChange={onChange} />;
}

/** The solid `#rrggbb` nearest a CSS colour the picker can't take (its red, green and blue, alpha
 *  dropped), or black when it isn't spelled in channels. */
function solidOf(css: string): string {
  const m = /^\s*rgba?\(\s*(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)/i.exec(css);
  if (!m) return hslToHex({ h: 0, s: 0, l: 0 });
  return `#${[m[1], m[2], m[3]].map((c) => Math.max(0, Math.min(255, Math.round(Number(c)))).toString(16).padStart(2, '0')).join('')}`;
}

/** The H, S and L fields and what each is called. */
const CHANNELS = [
  { key: 'h', word: 'hue', param: (d: number) => intParam(0, 359, d, 'H %d') },
  { key: 's', word: 'saturation', param: (d: number) => intParam(0, 100, d, 'S %d') },
  { key: 'l', word: 'lightness', param: (d: number) => intParam(0, 100, d, 'L %d') },
] as const;

/**
 * One colour role: a swatch that opens the system colour picker, the hex, H/S/L fields, and a
 * reset while it is overridden. Writes go through `setOverride` at `path`.
 */
export function ColourRow({
  skin,
  name,
  path,
  value,
  base,
  onChange,
}: {
  skin: Skin;
  name: string;
  path: OverridePath;
  value: unknown;
  base: unknown;
  onChange(skin: Skin): void;
}) {
  // The last H/S/L asked for, so a hue survives a trip through grey (saturation 0) while dragging.
  const held = useRef<{ hsl: Hsl; hex: string } | null>(null);
  const overridden = getOverride(skin, path) !== undefined;
  const [, rerender] = useState(0);
  if (!isHex(value)) {
    // A colour the fields can't hold (a translucent glass surface): shown as it is; picking a
    // colour replaces it with a solid one, and Reset brings it back.
    const raw = String(value);
    return (
      <Row label={name} className="zen-theme-editor__colour">
        <label className="zen-theme-editor__swatch" data-part="swatch" style={{ background: raw }} title={`${raw}: picking a colour makes it solid`}>
          <input type="color" value={solidOf(raw)} aria-label={`${name} colour`} onChange={(e) => onChange(setOverride(skin, path, e.currentTarget.value.toLowerCase()))} />
        </label>
        <Text role="code" tone="secondary" truncate title={raw} className="zen-theme-editor__raw" data-part="hex">
          {raw}
        </Text>
        {overridden && <Button label="Reset" variant="quiet" name={`Reset ${name}`} onPress={() => onChange(clearOverride(skin, path))} />}
      </Row>
    );
  }
  const hex = value.toLowerCase();
  const hsl = held.current && held.current.hex === hex ? held.current.hsl : hexToHsl(hex);
  const baseHsl = isHex(base) ? hexToHsl(base) : hsl;
  const write = (next: string) => onChange(setOverride(skin, path, next.toLowerCase()));
  const writeHsl = (next: Hsl) => {
    const out = hslToHex(next);
    held.current = { hsl: next, hex: out };
    if (out === hex) rerender((n) => n + 1);
    else write(out);
  };
  return (
    <Row label={name} className="zen-theme-editor__colour">
      <label className="zen-theme-editor__swatch" data-part="swatch" style={{ background: hex }} title={`Pick ${name.toLowerCase()}`}>
        <input type="color" value={hex} aria-label={`${name} colour`} onChange={(e) => write(e.currentTarget.value)} />
      </label>
      <Text role="code" tone="secondary" className="zen-theme-editor__hex" data-part="hex">
        {hex}
      </Text>
      {CHANNELS.map((c) => (
        <NumberField
          key={c.key}
          param={c.param(baseHsl[c.key])}
          value={hsl[c.key]}
          label={`${name} ${c.word}`}
          name=""
          showFill={false}
          onChange={(v) => writeHsl({ ...hsl, [c.key]: v })}
        />
      ))}
      {overridden && <Button label="Reset" variant="quiet" name={`Reset ${name}`} onPress={() => onChange(clearOverride(skin, path))} />}
    </Row>
  );
}

export const FACET_TITLES: Record<FacetName, string> = { palette: 'Palette', faces: 'Type', scale: 'Scale', materials: 'Materials' };

/** Whether a facet differs from the base pack's: swapped or overridden. */
export const facetDiffers = (skin: Skin, facet: FacetName) => skin.facets?.[facet] !== undefined || skin.overrides?.[facet] !== undefined;

/** A facet tab's head: wear another named facet, or put this one back as the pack has it. */
export function FacetHead({ skin, facet, onChange }: { skin: Skin; facet: FacetName; onChange(skin: Skin): void }) {
  const list = FACET_LISTS[facet];
  const pack = packs.find((p) => p.id === skin.base);
  const items = [`From ${pack?.label ?? skin.base}`, ...list.map((f) => f.label)];
  const swapped = skin.facets?.[facet];
  const index = swapped ? list.findIndex((f) => f.id === swapped) + 1 : 0;
  const title = FACET_TITLES[facet];
  return (
    <Row label="From">
      <Select
        className="zen-theme-editor__select"
        items={items}
        index={Math.max(0, index)}
        label={`${title} from`}
        onChange={(i) => onChange(swapFacet(skin, facet, i === 0 ? FROM_THEME : list[i - 1].id))}
      />
      <Button label={`Reset ${title.toLowerCase()}`} variant="quiet" disabled={!facetDiffers(skin, facet)} onPress={() => onChange(resetFacet(skin, facet))} />
    </Row>
  );
}
