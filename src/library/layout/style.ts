// Inline style as framework-free data: a model gives its declarations as CSS names (`grid-area`,
// `--lib-at-x`) to string values; React takes them as a style object, Svelte as a `style` string.
import type { CSSProperties } from 'react';

/** Declarations by CSS property name; an undefined value is no declaration. */
export type StyleDecls = Record<string, string | undefined>;

const camel = (name: string) => (name.startsWith('--') ? name : name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()));

/** The declarations as a React style object (custom properties keep their names), merged before `extra`. */
export function reactStyle(decls: StyleDecls, extra?: CSSProperties): CSSProperties | undefined {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(decls)) if (value !== undefined) out[camel(name)] = value;
  if (!Object.keys(out).length) return extra;
  return { ...(out as CSSProperties), ...extra };
}

/** The declarations as a `style` attribute string, `extra` (the caller's own style) after them; undefined when empty. */
export function styleString(decls: StyleDecls, extra?: string): string | undefined {
  const own = Object.entries(decls)
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => `${name}: ${value}`)
    .join('; ');
  const all = [own, extra?.trim()].filter(Boolean).join('; ');
  return all || undefined;
}
