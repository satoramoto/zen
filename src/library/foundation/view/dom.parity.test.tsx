// The DOM renderer held to React's and Svelte's over every fixture of every part it draws: each
// part's three bindings draw the same DOM, generated ids masked (parity.ts). One line per part in
// `PARTS`, as `domComponents.ts` has one per part; a part there and not here fails.
import { describe, expect, it } from 'vitest';
import type { ComponentType } from 'react';
import { domDom, maskIds, reactDom, svelteDom } from '../../parity';
import { instances } from '../../fixtures';
import { domParts } from './domComponents';
import { reactComponent } from './reactComponents';
import { svelteComponent } from './svelteComponents';
import { Hole, Opaque } from '../../primitives/Surface/Surface';
import { Icon } from '../../primitives/Icon/Icon';
import HoleSvelte from '../../primitives/Hole/Hole.svelte';
import OpaqueSvelte from '../../primitives/Opaque/Opaque.svelte';
import IconSvelte from '../../primitives/Icon/Icon.svelte';
import { VoteControl } from '../../components/VoteControl/VoteControl';
import VoteControlSvelte from '../../components/VoteControl/VoteControl.svelte';
import { DOM_FIXTURES as PARTS } from './domFixtures';

/** The parts neither registry holds by name (a binding draws them directly). */
const DIRECT: Record<string, [ComponentType<any>, unknown]> = { Hole: [Hole, HoleSvelte], Opaque: [Opaque, OpaqueSvelte], Icon: [Icon, IconSvelte], VoteControl: [VoteControl, VoteControlSvelte] };

/** Generated ids masked, and VoteControl's own (`lib-vote-<n>`, a count of the controls made so far). */
const mask = (dom: string) => maskIds(dom).replace(/lib-vote-\d+/g, 'lib-vote-n');

describe('the DOM renderer draws every part as React and Svelte do', () => {
  it('every part it draws is held here', () => {
    expect(Object.keys(PARTS).sort()).toEqual(Object.keys(domParts()).sort());
  });
  for (const [name, fixtures] of Object.entries(PARTS)) {
    if (!fixtures) continue;
    describe(name, () => {
      const [react, svelte] = DIRECT[name] ?? [reactComponent(name), svelteComponent(name)];
      for (const [story, fixture] of Object.entries(fixtures)) {
        const all = instances(fixture);
        all.forEach((props, i) => {
          it(all.length > 1 ? `${story} #${i + 1}` : story, () => {
            const expected = mask(reactDom(react, props));
            expect(expected).not.toBe('');
            expect(mask(svelteDom(svelte, props))).toBe(expected);
            expect(mask(domDom(name, props))).toBe(expected);
          });
        });
      }
    });
  }
});
