import { useLayoutEffect, useRef } from 'react';
import { MovablePoint, type MovablePointProps } from 'mafs';
import type { Quantity } from '../../relationship';

/** Mafs supplies pointer geometry; Zen supplies quantity semantics and predictable keyboard steps. */
export function RelationshipHandle({ label, quantity, value, onValue, onEngage, onHighlight, ...point }: MovablePointProps & {
  label: string; quantity: Quantity; value: number;
  onValue(value: number): void; onEngage(): void; onHighlight(active: boolean): void;
}) {
  const host = useRef<SVGGElement>(null);
  useLayoutEffect(() => {
    const handle = host.current?.querySelector('.mafs-movable-point');
    if (!handle) return;
    for (const [key, val] of Object.entries({ role: 'slider', 'aria-label': label, 'aria-valuemin': quantity.min, 'aria-valuemax': quantity.max, 'aria-valuenow': value, 'aria-valuetext': value.toFixed(2), 'aria-description': 'Drag to explore. Arrow keys adjust; Home and End select the limits.' })) handle.setAttribute(key, String(val));
  }, [label, quantity, value]);
  return <g ref={host} data-handle={label} onPointerDownCapture={onEngage} onPointerEnter={() => onHighlight(true)} onPointerLeave={() => onHighlight(false)} onFocusCapture={() => onHighlight(true)} onBlurCapture={() => onHighlight(false)} onKeyDownCapture={event => {
    const direction = ['ArrowUp', 'ArrowRight'].includes(event.key) ? 1 : ['ArrowDown', 'ArrowLeft'].includes(event.key) ? -1 : 0;
    if (!direction && !['Home', 'End'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation(); onEngage();
    onValue(event.key === 'Home' ? quantity.min : event.key === 'End' ? quantity.max : value + direction * quantity.step * (event.shiftKey ? 5 : 1));
  }}><MovablePoint {...point} /></g>;
}
