import { useRef, type KeyboardEvent, type PointerEvent } from 'react';
import { focusRing } from '../../../primitives/Ring';
import { Text } from '../../../primitives/Text';
import { unitSuffix, type Quantity } from '../../model/document';
import './Scrub.css';

export interface ScrubProps {
  /** The quantity's name, for its accessible name when it has no label. */
  name: string;
  quantity: Quantity;
  onChange(value: number): void;
}

/** How many pixels of drag move the value by one step. */
const PX_PER_STEP = 12;

const decimals = (step: number) => Math.max(0, Math.min(6, -Math.floor(Math.log10(step))));

/**
 * **Job.** A number in the running text the reader can change: drag it sideways, or focus it and
 * use the arrow keys (Shift for ten steps, Home and End for the ends). It is a slider to
 * assistive technology. Whatever is bound to the same quantity (a figure, a `ref` run) follows.
 */
export function Scrub({ name, quantity, onChange }: ScrubProps) {
  const { value, min, max, unit, label } = quantity;
  const step = quantity.step ?? 1;
  const drag = useRef<{ x: number; start: number } | null>(null);
  // The value the handlers step from: the latest one reported, so two keys in one frame both
  // count even before the page has re-rendered with the first.
  const latest = useRef(value);
  latest.current = value;
  // Steps are counted from the minimum, so a range like 1 to 101 in twos stays on the odd numbers.
  const clamp = (v: number) => Math.min(max, Math.max(min, min + Math.round((v - min) / step) * step));
  const set = (v: number) => {
    const next = clamp(v);
    if (next !== latest.current) {
      latest.current = next;
      onChange(next);
    }
  };
  const down = (e: PointerEvent<HTMLSpanElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, start: value };
    e.currentTarget.focus();
  };
  const move = (e: PointerEvent<HTMLSpanElement>) => {
    if (!drag.current) return;
    set(drag.current.start + ((e.clientX - drag.current.x) / PX_PER_STEP) * step);
  };
  const up = () => {
    drag.current = null;
  };
  const key = (e: KeyboardEvent<HTMLSpanElement>) => {
    const big = e.shiftKey ? 10 : 1;
    const from = latest.current;
    const moves: Record<string, number | undefined> = {
      ArrowUp: from + step * big,
      ArrowRight: from + step * big,
      ArrowDown: from - step * big,
      ArrowLeft: from - step * big,
      Home: min,
      End: max,
    };
    const next = moves[e.key];
    if (next === undefined) return;
    e.preventDefault();
    set(next);
  };
  const shown = value.toFixed(decimals(step));
  return (
    <Text
      as="span"
      role="numeral"
      size="inherit"
      tone="accent"
      tabular
      className={`cmp-scrub ${focusRing}`}
      ariaRole="slider"
      tabIndex={0}
      aria-label={label ?? name}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${shown}${unitSuffix(unit)}`}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={key}
      data-dragging={drag.current ? '' : undefined}
    >
      {shown}
      {unit && <span className="cmp-scrub__unit">{unitSuffix(unit)}</span>}
    </Text>
  );
}

/** A quantity's value in the text, read-only; `format` puts it where its `{}` is. */
export function Ref({ quantity, format }: { quantity: Quantity; format?: string }) {
  const shown = quantity.value.toFixed(decimals(quantity.step ?? 1));
  const text = format ? format.replace('{}', shown) : `${shown}${unitSuffix(quantity.unit)}`;
  return (
    <Text as="span" role="numeral" size="inherit" tabular className="cmp-ref" aria-live="polite">
      {text}
    </Text>
  );
}
