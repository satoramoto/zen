// A stand-in for use-resize-observer 9 (https://github.com/ZeeCoder/use-resize-observer): the
// hook mafs imports as a default export, written for React 18 and 19 without the resize-observer
// polyfill v9 carried. Same contract: pass a ref (or let the hook give you one), get the
// observed element's content-box width and height, rounded; `onResize` hears each change
// instead when given; `box` picks another box to measure.
import { useCallback, useEffect, useRef, useState } from 'react';

const sizeOf = (entry, box) => {
  const pick = box === 'border-box' ? entry.borderBoxSize : box === 'device-pixel-content-box' ? entry.devicePixelContentBoxSize : entry.contentBoxSize;
  const first = Array.isArray(pick) ? pick[0] : pick;
  if (first && typeof first.inlineSize === 'number') return { width: first.inlineSize, height: first.blockSize };
  return { width: entry.contentRect.width, height: entry.contentRect.height };
};

export function useResizeObserver(options = {}) {
  const { ref: passedRef, onResize, box, round = Math.round } = options;
  const ownRef = useRef(null);
  const [size, setSize] = useState({ width: undefined, height: undefined });
  const latest = useRef({ onResize, round, width: undefined, height: undefined });
  latest.current.onResize = onResize;
  latest.current.round = round;
  const ref = passedRef ?? ownRef;
  const element = ref && typeof ref === 'object' && 'current' in ref ? ref.current : ref;
  useEffect(() => {
    const target = ref && typeof ref === 'object' && 'current' in ref ? ref.current : ref;
    if (!target || typeof ResizeObserver !== 'function') return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries.find((e) => e.target === target) ?? entries[0];
      if (!entry) return;
      const raw = sizeOf(entry, box);
      const width = latest.current.round(raw.width);
      const height = latest.current.round(raw.height);
      if (latest.current.width === width && latest.current.height === height) return;
      latest.current.width = width;
      latest.current.height = height;
      if (latest.current.onResize) latest.current.onResize({ width, height, entry });
      else setSize({ width, height });
    });
    observer.observe(target, box ? { box } : undefined);
    return () => observer.disconnect();
  }, [element, ref, box]);
  const refCallback = useCallback((node) => {
    ownRef.current = node;
  }, []);
  return { ref: passedRef ?? refCallback, width: size.width, height: size.height };
}

export default useResizeObserver;
