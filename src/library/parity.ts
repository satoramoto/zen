// The DOM-parity harness: a component's React and Svelte renderers, given the same fixture props,
// must draw the same DOM. `parity.test.tsx` calls `parity()` once per component; a lane adds one line.
//
// Compared: tag names; every attribute (class as a sorted set of tokens, `style` as a sorted set of
// declarations, the rest by value: `data-*`, ARIA, `role`, `type`, `title`, …); text, with
// adjacent text joined. Not compared: comment nodes (Svelte's anchors), attribute order.
//
// Generated ids differ by renderer (React's `useId`: `:r0:`, `«r0»`, `_r_0_`; Svelte's `$props.id()`:
// `c1` in the browser, `s1` on the server), so `maskIds` replaces each distinct one, wherever it sits
// in `id`, `for`, `aria-controls`, `aria-labelledby` or `aria-describedby` (`:r0:-panel` too), by its
// order of first appearance: references still have to agree. Authored ids (`tab-foo`) compare as is.
import { createElement, type ComponentType } from 'react';
import { render as renderReact } from '@testing-library/react';
import { render as renderSvelte } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { describe, expect, it } from 'vitest';
import { instances, type Fixtures } from './fixtures';
import Render from './foundation/svelte/stories/Render.svelte';
import { mountPart } from './foundation/view/domComponents';
import { textFill } from './foundation/view/dom';

export { serialize, maskIds } from './foundation/view/domText';
import { maskIds, serialize } from './foundation/view/domText';

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

/** Draws `props` with the DOM renderer's part named `name` (a string `children` as its text, as
 *  Svelte's `Render` draws it) and returns its DOM, serialized. */
export function domDom(name: string, props: object): string {
  const container = document.createElement('div');
  document.body.append(container);
  const { children, ...rest } = props as Record<string, unknown>;
  const part = mountPart(container, name, typeof children === 'string' ? { ...rest, children: textFill(children) } : (props as Record<string, unknown>));
  const dom = serialize(container);
  part.destroy();
  container.remove();
  return dom;
}

/**
 * One test per fixture instance: `react` and `svelte` render it to the same DOM, generated ids
 * masked (`maskIds`). `fixtures` is the
 * component's `<Name>.fixtures.ts` stories (every story's args, or its items over them).
 */
export function parity(name: string, react: ComponentType<any>, svelte: unknown, fixtures: Fixtures<object>): void {
  describe(`${name}: React and Svelte draw the same DOM`, () => {
    for (const [story, fixture] of Object.entries(fixtures)) {
      const all = instances(fixture);
      all.forEach((props, i) => {
        it(all.length > 1 ? `${story} #${i + 1}` : story, () => {
          const expected = maskIds(reactDom(react, props));
          expect(expected).not.toBe('');
          expect(maskIds(svelteDom(svelte, props))).toBe(expected);
        });
      });
    }
  });
}
