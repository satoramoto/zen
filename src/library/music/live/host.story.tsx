// Story harness (not shipped): the app a live pane's contract stories stand in for. A pane holds no
// state: it asks a callback and redraws from its props. `withHost` is that host, for a story whose
// `parameters.host` names how each callback changes the props (`apply`), so a play can drive the
// real controls and then read the pane's controlled props back, in React's renderer and Svelte's.
// The spies in `args` still record every intent. It can also rebind the pane (`presets`: other props
// a host could hand it, a button each) and remove and remount it (`removable`), so a play can show
// the old target goes quiet and a store bound to a removed pane lets go. Everything it draws outside
// the pane is labelled story scenario data, not part of the component.
//
// The host's props are React state, not Storybook args: updating args mid-play re-prepares the
// story (its spies reset and the play is abandoned), where a state change redraws the pane alone.
import { createElement, useRef, useState, type ReactNode } from 'react';
import type { Decorator } from '@storybook/react-vite';
import { expect } from 'storybook/test';

/** How a host applies each callback a pane asks: the props it changes. */
export type HostApply<A> = { [K in keyof A]?: (props: A, ...call: any[]) => Partial<A> };

export interface HostParameters<A> {
  apply?: HostApply<A>;
  /** Other props a host could bind the pane to, by button label: `{ 'Bind Bass': { track: … } }`. */
  presets?: Record<string, Partial<A>>;
  /** Show Remove pane / Mount pane. */
  removable?: boolean;
}

/** A story's host parameters, typed against its component's props. */
export const host = <A,>(parameters: HostParameters<A>): { host: HostParameters<A> } => ({ host: parameters });

const bar = { display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', alignItems: 'center', padding: 'var(--space-2)', fontSize: 12, opacity: 0.85 } as const;

type Props = Record<string, unknown>;

/** A callback this host wrapped, holding the story's spy it calls first. */
const SPY = Symbol('spy');
type Wrapped = ((...call: unknown[]) => void) & { [SPY]?: (...call: unknown[]) => void };

/**
 * The host. Place it after `withRenderer` and `withStoryFrame` in the meta's decorators (outside
 * them), so both renderers get its wrapped callbacks and the frame holds the pane alone. A story
 * without `parameters.host` is drawn as written.
 */
export const withHost: Decorator = (Story, context) => {
  const spec = context.parameters.host as HostParameters<Props> | undefined;
  // Hooks run on every render, in order, as `withStoryFrame`'s do.
  const [changes, setChanges] = useState<Props>({});
  const [mounted, setMounted] = useState(true);
  const latest = useRef<Props>({});
  if (!spec) return Story();
  const props: Props = { ...context.args, ...changes };
  latest.current = props;
  const change = (next: Props) => {
    latest.current = { ...latest.current, ...next };
    setChanges((held) => ({ ...held, ...next }));
  };
  const wrapped: Props = { ...props };
  for (const [name, apply] of Object.entries(spec.apply ?? {})) {
    // Storybook keeps the args this host passed down: when the host redraws itself, `context.args`
    // already holds its last wrapper. Unwrap to the story's own spy, or every redraw nests another.
    const given = context.args[name] as Wrapped | undefined;
    const spy = given?.[SPY] ?? given;
    if (typeof spy !== 'function' || !apply) continue;
    const wrapper: Wrapped = (...call: unknown[]) => {
      spy(...call);
      change(apply(latest.current, ...call));
    };
    wrapper[SPY] = spy;
    wrapped[name] = wrapper;
  }
  const tools: ReactNode[] = Object.entries(spec.presets ?? {}).map(([label, next]) =>
    createElement('button', { key: label, type: 'button', onClick: () => change(next) }, label),
  );
  if (spec.removable) tools.push(createElement('button', { key: 'mount', type: 'button', onClick: () => setMounted(!mounted) }, mounted ? 'Remove pane' : 'Mount pane'));
  return createElement(
    'div',
    { 'data-story-host': '' },
    tools.length ? createElement('div', { role: 'toolbar', 'aria-label': 'Story host (scenario data)', style: bar }, createElement('span', {}, 'Story host:'), ...tools) : null,
    mounted ? Story({ args: wrapped }) : createElement('p', { 'data-part': 'removed', style: bar }, 'Pane removed'),
  );
};

/**
 * A narrow form's check: the pane has no horizontal overflow, and every control it draws sits inside
 * its box (a clipped control is a control the performer can't reach). Hidden controls are skipped.
 */
export async function expectFits(canvasElement: HTMLElement): Promise<void> {
  const pane = canvasElement.querySelector<HTMLElement>('.live-pane')!;
  await expect(pane.scrollWidth).toBeLessThanOrEqual(pane.clientWidth + 1);
  const box = pane.getBoundingClientRect();
  const outside = [...pane.querySelectorAll<HTMLElement>('button, [role="slider"], [role="radio"], [role="button"]')]
    .filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      return r.left < box.left - 1 || r.right > box.right + 1 || r.top < box.top - 1 || r.bottom > box.bottom + 1;
    })
    .map((el) => el.getAttribute('aria-label') ?? el.textContent);
  await expect(outside).toEqual([]);
}
