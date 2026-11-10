// `Contain` in both renderers, over one tree: a part that throws while drawing is replaced by the
// tree's `failed` slot, `onError` is told what the error said, everything outside it stays drawn,
// and a new `resetKey` tries the part again.
import { createElement } from 'react';
import { act, render as renderReact } from '@testing-library/react';
import { render as renderSvelte } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Tree } from './Tree';
import TreeSvelte from './Tree.svelte';
import { component, h, type Node } from './Tree.model';
import { reactComponent } from './reactComponents';
import { svelteComponent } from './svelteComponents';
import ThrowsSvelte from './fixtures/Throws.svelte';

function Throws({ broken }: { broken?: boolean }) {
  if (broken) throw new Error('boom');
  return createElement('p', { 'data-part': 'ok' }, 'ok');
}

const tree = (broken: boolean, resetKey: number): Node =>
  h(
    'div',
    { 'data-part': 'root' },
    h('p', { 'data-part': 'beside' }, 'beside'),
    component('Contain', { resetKey }, { on: { onError: 'told' }, slots: { children: [component('Throws', { broken })], failed: [h('p', { 'data-part': 'failed', role: 'alert' }, 'stopped')] } }),
  );

const parts = (el: Element): string[] => [...el.querySelectorAll('[data-part]')].map((p) => (p as HTMLElement).dataset.part!);

describe('Contain', () => {
  // A caught error is still logged by both frameworks; the tests assert on what is drawn and told.
  const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
  afterEach(() => quiet.mockClear());

  it('React: draws the failed slot, tells the app, and tries again on a new key', () => {
    const told = vi.fn();
    const components = (name: string) => (name === 'Throws' ? Throws : reactComponent(name));
    const draw = (broken: boolean, key: number) => createElement(Tree, { tree: tree(broken, key), handlers: { told }, components: components as never });
    const view = renderReact(draw(true, 0));
    expect(parts(view.container)).toEqual(['root', 'beside', 'failed']);
    expect(told).toHaveBeenCalledWith('boom');
    // Mended, but the same key: the note stays until a retry.
    act(() => view.rerender(draw(false, 0)));
    expect(parts(view.container)).toEqual(['root', 'beside', 'failed']);
    act(() => view.rerender(draw(false, 1)));
    expect(parts(view.container)).toEqual(['root', 'beside', 'ok']);
  });

  it('React: a part that draws is all there is', () => {
    const told = vi.fn();
    const components = (name: string) => (name === 'Throws' ? Throws : reactComponent(name));
    const view = renderReact(createElement(Tree, { tree: tree(false, 0), handlers: { told }, components: components as never }));
    expect(parts(view.container)).toEqual(['root', 'beside', 'ok']);
    expect(told).not.toHaveBeenCalled();
  });

  it('Svelte: draws the failed slot, tells the app, and tries again on a new key', async () => {
    const told = vi.fn();
    const components = (name: string) => (name === 'Throws' ? ThrowsSvelte : svelteComponent(name));
    const view = renderSvelte(TreeSvelte, { props: { tree: tree(true, 0), handlers: { told }, components: components as never } });
    flushSync();
    expect(parts(view.container)).toEqual(['root', 'beside', 'failed']);
    expect(told).toHaveBeenCalledWith('boom');
    await view.rerender({ tree: tree(false, 1), handlers: { told }, components: components as never });
    flushSync();
    expect(parts(view.container)).toEqual(['root', 'beside', 'ok']);
  });

  it('Svelte: a part that draws is all there is', () => {
    const told = vi.fn();
    const components = (name: string) => (name === 'Throws' ? ThrowsSvelte : svelteComponent(name));
    const view = renderSvelte(TreeSvelte, { props: { tree: tree(false, 0), handlers: { told }, components: components as never } });
    flushSync();
    expect(parts(view.container)).toEqual(['root', 'beside', 'ok']);
    expect(told).not.toHaveBeenCalled();
  });
});
