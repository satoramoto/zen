// What an app outside zen builds the zen way, for the App parts stories: a part's model (a tree), a
// store, and the two bindings (`AppGauge.story.tsx`, `AppGauge.story.svelte`). The stories register
// them through the public view entries, as an app does.
import { component, h, wire, type Node } from '../../view';

/** The app's gauge: a meter of `level` out of four, drawn by whichever renderer draws the tree. */
export const appGaugeView = (level: number): Node => h('meter', { class: 'app-gauge', 'data-part': 'app-gauge', min: '0', max: '4', value: String(level), 'aria-label': 'App gauge' });

/** The tree a story draws: zen's own tree naming the app's part, and an element the app's store binds. */
export const appTree = (): Node =>
  h('div', { 'data-part': 'app-tree' },
    component('AppGauge', { level: 3 }),
    wire(h('span', { 'data-part': 'held' }, 'Hold me'), { bind: [['appHold', {}]] }),
  );

/** What the app's store did, in order, for a play to read. */
export const holdLog: string[] = [];

/** The app's store: marks its element while bound, and says when it was applied and removed. */
export function bindAppHold(node: HTMLElement): { destroy(): void } {
  node.dataset.held = 'bound';
  holdLog.push('applied');
  return {
    destroy() {
      holdLog.push('removed');
    },
  };
}
