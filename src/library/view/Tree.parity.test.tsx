// The two Tree renderers, held to each other over one synthetic tree that uses every feature:
// text, nesting, slots, attributes (boolean, style, SVG), `on` handlers, `bind` stores, keyed lists,
// component nodes (props, callbacks by key, slots) and form properties.
// Converted components then need no DOM parity of their own: their trees are snapshotted
// (snapshot.test.ts), and this proves both renderers draw any tree the same.
import { createElement } from 'react';
import { act, fireEvent, render as renderReact } from '@testing-library/react';
import { render as renderSvelte } from '@testing-library/svelte';
import { createRawSnippet, flushSync } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import { serialize } from '../parity';
import { Tree } from './Tree';
import TreeSvelte from './Tree.svelte';
import { component, each, h, slot, when, wire, type Handlers, type Node } from './Tree.model';
import type { Store, Stores } from './stores';

/** A store that logs what the renderer does to it, and calls its `ping` handler key on click. */
function recorder(log: string[]): Stores {
  const probe: Store<{ n: number; ping?: string }> = (node, params, handler) => {
    log.push(`mount ${node.tagName.toLowerCase()} ${params.n}`);
    let current = params;
    const click = () => handler(current.ping ?? '')?.(`ping ${current.n}`);
    node.addEventListener('click', click);
    return {
      update(next) {
        current = next;
        log.push(`update ${next.n}`);
      },
      destroy() {
        node.removeEventListener('click', click);
        log.push('destroy');
      },
    };
  };
  return { probe };
}

const sample = (order: string[], n = 1, extra = false): Node =>
  h(
    'section',
    { class: 'root a', 'data-part': 'root', 'aria-label': 'Sample', hidden: undefined },
    'lead ',
    h('b', {}, 'bold'),
    ' tail',
    h('span', { class: 'slot-host' }, slot('icon')),
    slot('missing'),
    when(extra, () => h('i', {}, 'extra')),
    wire(h('button', { type: 'button', disabled: '', style: 'min-width: 2px; --yh-x: 3' }, 'Go'), {
      on: { click: 'press' },
      bind: [['probe', { n, ping: 'ping' }]],
    }),
    h('svg', { viewBox: '0 0 10 10', 'aria-hidden': 'true' }, h('path', { d: 'M 0 0 L 1 1', 'stroke-width': '2' })),
    h(
      'ul',
      {},
      each(
        order,
        (id) => id,
        (id) => h('li', { 'data-id': id }, id),
      ),
    ),
  );

const reactSlots = { icon: createElement('em', null, 'icon') };
const svelteSlots = { icon: createRawSnippet(() => ({ render: () => '<em>icon</em>' })) };

function both(tree: Node, handlers: Handlers, stores: Stores) {
  const react = renderReact(createElement(Tree, { tree, slots: reactSlots, handlers, stores }));
  const svelte = renderSvelte(TreeSvelte, { props: { tree, slots: svelteSlots, handlers, stores } });
  return { react, svelte };
}

describe('Tree: React and Svelte draw any tree the same', () => {
  it('the same DOM: text, nesting, slots, attributes, SVG, a keyed list', () => {
    const { react, svelte } = both(sample(['a', 'b', 'c']), {}, recorder([]));
    const dom = serialize(react.container);
    expect(dom).toContain('<em>');
    expect(dom).toContain('disabled=""');
    expect(serialize(svelte.container)).toBe(dom);
    for (const container of [react.container, svelte.container]) {
      expect(container.querySelector('path')!.namespaceURI).toBe('http://www.w3.org/2000/svg');
      expect(container.querySelector('svg')!.namespaceURI).toBe('http://www.w3.org/2000/svg');
      expect((container.querySelector('button') as HTMLButtonElement).disabled).toBe(true);
      expect(container.querySelector('button')!.style.getPropertyValue('--yh-x')).toBe('3');
    }
    react.unmount();
    svelte.unmount();
  });

  it('handlers by key, and stores: mounted, updated on new params or handlers, destroyed', async () => {
    const logs = { react: [] as string[], svelte: [] as string[] };
    const calls = { react: [] as string[], svelte: [] as string[] };
    const handlersFor = (side: 'react' | 'svelte'): Handlers => ({
      press: () => calls[side].push('press'),
      ping: (what: string) => calls[side].push(what),
    });
    const react = renderReact(createElement(Tree, { tree: sample(['a']), slots: reactSlots, handlers: handlersFor('react'), stores: recorder(logs.react) }));
    const svelteHandlers = handlersFor('svelte');
    const svelteStores = recorder(logs.svelte);
    const svelte = renderSvelte(TreeSvelte, { props: { tree: sample(['a']), slots: svelteSlots, handlers: svelteHandlers, stores: svelteStores } });

    fireEvent.click(react.container.querySelector('button')!);
    fireEvent.click(svelte.container.querySelector('button')!);
    // The store's capture-free listener was added first, so it runs before the `on` handler.
    expect(calls.react).toEqual(['ping 1', 'press']);
    expect(calls.svelte).toEqual(calls.react);

    // New params and new handlers: one update each, and a click reaches the latest handlers.
    const latest = (side: 'react' | 'svelte'): Handlers => ({
      press: () => calls[side].push('press v2'),
      ping: (what: string) => calls[side].push(`${what} v2`),
    });
    const reactStores = recorder(logs.react);
    react.rerender(createElement(Tree, { tree: sample(['a'], 2), slots: reactSlots, handlers: latest('react'), stores: reactStores }));
    await svelte.rerender({ tree: sample(['a'], 2), slots: svelteSlots, handlers: latest('svelte'), stores: svelteStores });
    expect(logs.react.filter((l) => l === 'update 2').length).toBeGreaterThanOrEqual(1);
    expect(logs.svelte.filter((l) => l === 'update 2').length).toBeGreaterThanOrEqual(1);
    expect(logs.react[0]).toBe('mount button 1');
    expect(logs.svelte[0]).toBe('mount button 1');
    const buttons = { react: react.container.querySelector('button')!, svelte: svelte.container.querySelector('button')! };
    fireEvent.click(buttons.react);
    fireEvent.click(buttons.svelte);
    expect(calls.react).toEqual(['ping 1', 'press', 'ping 2 v2', 'press v2']);
    expect(calls.svelte).toEqual(calls.react);

    act(() => react.unmount());
    svelte.unmount();
    flushSync();
    // Unmounted: the `on` listeners (and the store's) are gone from the element.
    fireEvent.click(buttons.react);
    fireEvent.click(buttons.svelte);
    expect(calls.react).toHaveLength(4);
    expect(calls.svelte).toHaveLength(4);
    expect(logs.react.at(-1)).toBe('destroy');
    expect(logs.svelte.at(-1)).toBe('destroy');
    expect(logs.react.filter((l) => l.startsWith('mount'))).toHaveLength(1);
    expect(logs.svelte.filter((l) => l.startsWith('mount'))).toHaveLength(1);
  });

  it('keyed children move, not redraw; a conditional child comes and goes', async () => {
    const stores = recorder([]);
    const react = renderReact(createElement(Tree, { tree: sample(['a', 'b', 'c']), slots: reactSlots, stores }));
    const svelte = renderSvelte(TreeSvelte, { props: { tree: sample(['a', 'b', 'c']), slots: svelteSlots, stores } });
    const items = (container: HTMLElement) => Array.from(container.querySelectorAll('li'));
    const before = { react: items(react.container), svelte: items(svelte.container) };

    react.rerender(createElement(Tree, { tree: sample(['c', 'a', 'b'], 1, true), slots: reactSlots, stores }));
    await svelte.rerender({ tree: sample(['c', 'a', 'b'], 1, true), slots: svelteSlots, stores });
    for (const side of ['react', 'svelte'] as const) {
      const container = side === 'react' ? react.container : svelte.container;
      const after = items(container);
      expect(after.map((li) => li.dataset.id)).toEqual(['c', 'a', 'b']);
      expect({ side, same: after.map((li, i) => li === [before[side][2], before[side][0], before[side][1]][i]) }).toEqual({ side, same: [true, true, true] });
      expect(container.querySelector('i')?.textContent).toBe('extra');
    }
    expect(serialize(svelte.container)).toBe(serialize(react.container));
    react.unmount();
    svelte.unmount();
  });

  it('component nodes: registered components, data props, `on` callbacks by key, slots filled with subtrees or passed through; form properties', async () => {
    const composite = (value: string, checked: boolean): Node =>
      h(
        'div',
        { class: 'page' },
        component('SettingsRow', { id: 'upper', label: 'Upper', hint: 'Right hand' }, {
          slots: {
            children: [
              component('LampButton', { label: 'On', name: 'Upper', on: true }, { on: { onToggle: 'toggle' } }),
              h('input', { type: 'range', min: '0', max: '30', value }),
              h('input', { type: 'checkbox', checked: checked ? '' : undefined }),
            ],
          },
        }),
        component('SettingsRow', { id: 'pass', label: 'Passed through' }, { slots: { children: slot('icon') } }),
      );
    const calls = { react: [] as unknown[], svelte: [] as unknown[] };
    const react = renderReact(createElement(Tree, { tree: composite('10', true), slots: reactSlots, handlers: { toggle: (on: boolean) => calls.react.push(on) } }));
    const svelteHandlers = { toggle: (on: boolean) => calls.svelte.push(on) };
    const svelte = renderSvelte(TreeSvelte, { props: { tree: composite('10', true), slots: svelteSlots, handlers: svelteHandlers } });

    const dom = serialize(react.container);
    expect(dom).toContain('yh-settings-row');
    expect(dom).toContain('yh-lampbutton');
    expect(dom).toContain('<em>');
    expect(dom).not.toContain('value=');
    expect(dom).not.toContain('checked=');
    expect(serialize(svelte.container)).toBe(dom);

    for (const [side, container] of [['react', react.container], ['svelte', svelte.container]] as const) {
      fireEvent.click(container.querySelector('.yh-lampbutton')!);
      expect(calls[side]).toEqual([false]);
      expect((container.querySelector('input[type=range]') as HTMLInputElement).value).toBe('10');
      expect((container.querySelector('input[type=checkbox]') as HTMLInputElement).checked).toBe(true);
    }

    react.rerender(createElement(Tree, { tree: composite('12', false), slots: reactSlots, handlers: { toggle: (on: boolean) => calls.react.push(on) } }));
    await svelte.rerender({ tree: composite('12', false), slots: svelteSlots, handlers: svelteHandlers });
    for (const container of [react.container, svelte.container]) {
      expect((container.querySelector('input[type=range]') as HTMLInputElement).value).toBe('12');
      expect((container.querySelector('input[type=checkbox]') as HTMLInputElement).checked).toBe(false);
    }
    expect(serialize(svelte.container)).toBe(serialize(react.container));
    react.unmount();
    svelte.unmount();
  });

  it('enumerated attributes are "true" / "false", never empty; renamed attributes and a style holding `;` land the same', () => {
    const tree = h(
      'div',
      { draggable: '', contenteditable: 'false', spellcheck: '', 'aria-pressed': '', 'aria-hidden': 'false', style: 'background: url("data:image/svg+xml;utf8,<svg/>"); --x: 1' },
      h('input', { inputmode: 'numeric', autocomplete: 'off', maxlength: '4', spellcheck: 'false' }),
      h('table', {}, h('tbody', {}, h('tr', {}, h('td', { colspan: '2' }, 'x')))),
    );
    const { react, svelte } = both(tree, {}, {});
    const dom = serialize(react.container);
    for (const expected of ['draggable="true"', 'contenteditable="false"', 'spellcheck="true"', 'aria-pressed="true"', 'aria-hidden="false"', 'inputmode="numeric"', 'autocomplete="off"', 'maxlength="4"', 'colspan="2"']) {
      expect(dom).toContain(expected);
    }
    expect(serialize(svelte.container)).toBe(dom);
    for (const container of [react.container, svelte.container]) {
      const root = container.firstElementChild as HTMLElement;
      expect(root.style.getPropertyValue('--x')).toBe('1');
      expect(root.style.background).toContain('data:image/svg+xml;utf8');
    }
    react.unmount();
    svelte.unmount();
  });

  it('an unknown store name throws, naming the registry', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const tree = wire(h('div'), { bind: [['nope', {}]] });
    expect(() => renderReact(createElement(Tree, { tree, stores: {} }))).toThrow(/no store named "nope"/);
    spy.mockRestore();
  });
});
