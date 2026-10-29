import {describe, expect, it} from 'vitest';
import {button, column, control, section, text} from './ui.mjs';
import {initial, reduce, view} from './lab.mjs';
import type {Element} from './ui.mjs';

describe('portable Omarchy contract', () => {
  it('serializes a view without functions or framework objects', () => {
    const tree = column([section('Hardware', [text('Gain'), control('slider', 'Gain', 30, 'gain', {payload: {id: 4}}), button('Apply', 'apply')])]);
    expect(JSON.parse(JSON.stringify(tree))).toEqual(tree);
  });
  it('keeps state changes immutable', () => {
    const before = initial();
    const after = reduce(before, 'increment');
    expect(after.count).toBe(1);
    expect(before.count).toBe(0);
    expect(reduce(after, 'value', null, 80).value).toBe(80);
  });
  it('draws the lab entirely within the supported vocabulary', () => {
    const allowed = new Set(['column', 'row', 'section', 'text', 'button', 'slider', 'toggle', 'select', 'input']);
    function visit(node: Element) {
      expect(allowed.has(node.kind)).toBe(true);
      node.children.forEach(visit);
    }
    visit(view(initial()));
  });
});
