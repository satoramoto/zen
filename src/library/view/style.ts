// Inline style as framework-free data. A model gives its declarations as CSS names (`grid-area`,
// `--lib-at-x`) to string values (`StyleDecls`), and a tree's `style` attribute is their text
// (`styleText`, Tree.model.ts). These are the conversions around that: a caller's style (a string,
// or a React-style object) to the attribute's text (`styleAttr`), the text back to a style object
// (`styleObject`), declarations to a React style object or a string (`reactStyle`, `styleString`),
// and inline styles joined in order (`joinStyle`).
import type { CSSProperties } from 'react';
import { styleText } from './Tree.model';

/** Declarations by CSS property name; an undefined value is no declaration. */
export type StyleDecls = Record<string, string | undefined>;

/** An inline style as a binding gets it: a `style` string (Svelte), or a style object (React's
 *  `CSSProperties`: camel-cased names, numbers in px where React adds them). */
export type StyleInput = string | Readonly<Record<string, string | number | null | undefined>>;

/** Properties React draws a bare number for (no `px`). */
const UNITLESS = new Set([
  'animationIterationCount',
  'aspectRatio',
  'columnCount',
  'columns',
  'fillOpacity',
  'flex',
  'flexGrow',
  'flexShrink',
  'fontWeight',
  'gridArea',
  'gridColumn',
  'gridColumnEnd',
  'gridColumnStart',
  'gridRow',
  'gridRowEnd',
  'gridRowStart',
  'lineClamp',
  'lineHeight',
  'opacity',
  'order',
  'orphans',
  'scale',
  'strokeOpacity',
  'strokeWidth',
  'tabSize',
  'widows',
  'zIndex',
  'zoom',
]);

/** A style as the tree's `style` attribute: a string as is (trimmed), an object's declarations by
 *  their CSS names (`minWidth: 2` → `min-width: 2px`; null, empty and boolean values skipped);
 *  undefined when there is nothing to set. */
export function styleAttr(style: StyleInput | object | undefined): string | undefined {
  if (style === undefined || typeof style === 'string') return style?.trim() || undefined;
  const decls: StyleDecls = {};
  for (const [name, value] of Object.entries(style)) {
    if (value === null || value === undefined || value === '' || typeof value === 'boolean') continue;
    const css = name.startsWith('--') ? name : name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`).replace(/^ms-/, '-ms-');
    decls[css] = typeof value === 'number' && value !== 0 && !name.startsWith('--') && !UNITLESS.has(name) ? `${value}px` : String(value);
  }
  return styleText(decls);
}

/** A style string's declarations: split at `;` outside quotes and brackets, so a value may hold
 *  one (`url("data:image/svg+xml;utf8,…")`). */
function declarations(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quote = '';
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = '';
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '(' || c === '[') depth++;
    else if ((c === ')' || c === ']') && depth > 0) depth--;
    else if (c === ';' && depth === 0) {
      out.push(text.slice(start, i));
      start = i + 1;
    }
  }
  out.push(text.slice(start));
  return out;
}

/** A `style` string as a style object (`min-width` → `minWidth`, `-ms-x` → `msX`, `-webkit-x` →
 *  `WebkitX`; custom properties as is): React's `style` prop from a tree's attribute. A `;` inside
 *  quotes or brackets stays in its value. */
export function styleObject(text: string): Record<string, string> {
  const style: Record<string, string> = {};
  for (const declaration of declarations(text)) {
    const colon = declaration.indexOf(':');
    if (colon < 0) continue;
    const name = declaration.slice(0, colon).trim();
    if (!name) continue;
    style[name.startsWith('--') ? name : name.replace(/^-ms-/, 'ms-').replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = declaration.slice(colon + 1).trim();
  }
  return style;
}

/** Inline styles joined in order (the caller's after the component's own); undefined when empty. */
export const joinStyle = (...parts: (string | undefined)[]): string | undefined =>
  parts
    .map((part) => part?.trim().replace(/;$/, ''))
    .filter(Boolean)
    .join('; ') || undefined;

const camel = (name: string) => (name.startsWith('--') ? name : name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()));

/** The declarations as a React style object (custom properties keep their names), merged before `extra`. */
export function reactStyle(decls: StyleDecls, extra?: CSSProperties): CSSProperties | undefined {
  const out: Record<string, string> = {};
  for (const [name, value] of Object.entries(decls)) if (value !== undefined) out[camel(name)] = value;
  if (!Object.keys(out).length) return extra;
  return { ...(out as CSSProperties), ...extra };
}

/** The declarations as a `style` attribute string, `extra` (the caller's own style) after them; undefined when empty. */
export const styleString = (decls: StyleDecls, extra?: string): string | undefined => joinStyle(styleText(decls), extra);
