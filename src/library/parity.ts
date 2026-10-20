// The DOM-parity harness: a component's React and Svelte renderers, given the same fixture props,
// must draw the same DOM. `parity.test.tsx` calls `parity()` once per component; a lane adds one line.
//
// Compared: tag names; every attribute (class as a sorted set of tokens, `style` as a sorted set of
// declarations, the rest by value: `data-*`, ARIA, `role`, `type`, `title`, …); text, with
// adjacent text joined. Not compared: comment nodes (Svelte's anchors), attribute order.
import { createElement, type ComponentType } from 'react';
import { render as renderReact } from '@testing-library/react';
import { render as renderSvelte } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { describe, expect, it } from 'vitest';
import { instances, type Fixtures } from './fixtures';
import Render from './svelte/stories/Render.svelte';

const sortedTokens = (value: string, separator: RegExp) =>
  value
    .split(separator)
    .map((token) => token.trim())
    .filter(Boolean)
    .sort()
    .join(separator.source === ';' ? '; ' : ' ');

/** A node's DOM as canonical, indented text: one line per element and per run of text. */
export function serialize(node: Node, depth = 0): string {
  const pad = '  '.repeat(depth);
  const lines: string[] = [];
  let text = '';
  const flush = () => {
    if (text !== '') lines.push(`${pad}${JSON.stringify(text)}`);
    text = '';
  };
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent ?? '';
      continue;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue;
    flush();
    const element = child as Element;
    const attrs = Array.from(element.attributes)
      .map(({ name, value }) => {
        if (name === 'class') return `class="${sortedTokens(value, /\s+/)}"`;
        if (name === 'style') return `style="${sortedTokens(value, /;/)}"`;
        return `${name}="${value}"`;
      })
      .sort();
    lines.push(`${pad}<${element.tagName.toLowerCase()}${attrs.length ? ` ${attrs.join(' ')}` : ''}>`);
    const inner = serialize(element, depth + 1);
    if (inner) lines.push(inner);
  }
  flush();
  return lines.join('\n');
}

/** Renders `props` with the React component and returns its DOM, serialized. */
export function reactDom(component: ComponentType<any>, props: object): string {
  const { container, unmount } = renderReact(createElement(component, props));
  const dom = serialize(container);
  unmount();
  return dom;
}

/** Renders `props` with the Svelte component (a `.svelte` file's default export; a string
 *  `children` as its text) and returns its DOM, serialized. */
export function svelteDom(component: unknown, props: object): string {
  const { container, unmount } = renderSvelte(Render, { props: { component: component as Component<any>, props: props as Record<string, unknown> } });
  const dom = serialize(container);
  unmount();
  return dom;
}

/**
 * One test per fixture instance: `react` and `svelte` render it to the same DOM. `fixtures` is the
 * component's `<Name>.fixtures.ts` stories (every story's args, or its items over them).
 */
export function parity(name: string, react: ComponentType<any>, svelte: unknown, fixtures: Fixtures<object>): void {
  describe(`${name}: React and Svelte draw the same DOM`, () => {
    for (const [story, fixture] of Object.entries(fixtures)) {
      const all = instances(fixture);
      all.forEach((props, i) => {
        it(all.length > 1 ? `${story} #${i + 1}` : story, () => {
          const expected = reactDom(react, props);
          expect(expected).not.toBe('');
          expect(svelteDom(svelte, props)).toBe(expected);
        });
      });
    }
  });
}
