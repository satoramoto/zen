import { useState } from 'react';

/**
 * A value a page may hold or the figure may keep: with `prop` and `onChange` the page owns it;
 * with `prop` alone it is the starting value (and follows the prop when that changes); with
 * neither the figure starts from `fallback`. `set` updates whichever owns it and reports.
 *
 * The prop is followed by adjusting state during render, not in an effect: an effect would run
 * after the first interaction when that comes before the mount effects flush (a story's play
 * can), and put the starting value back over what the reader just did.
 */
export function useControlled<T>(prop: T | undefined, onChange: ((v: T) => void) | undefined, fallback: T): [T, (v: T) => void] {
  const [own, setOwn] = useState<T>(prop ?? fallback);
  const [seen, setSeen] = useState(prop);
  if (prop !== seen) {
    setSeen(prop);
    if (prop !== undefined) setOwn(prop);
  }
  const value = prop !== undefined && onChange ? prop : own;
  const set = (v: T) => {
    setOwn(v);
    onChange?.(v);
  };
  return [value, set];
}
