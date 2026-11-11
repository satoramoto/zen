// The RearPanel's model: the unit's back, as a row of named ports and the power button
// (openspec: push-surface, "The rear panel shows the unit's connections"). No framework:
// `RearPanel.tsx` and `RearPanel.svelte` both pass `rearPanelView` and `rearPanelHandlers` to
// their `Tree`. A port is a `StatusDot` and two `Text`s; the power button is a `Pad` in a cell the
// surface's input store hears, so a hold of it is reported as a down and an up with their times.
import { textNode } from '../../../primitives/Text/Text.model';
import { component, h, wire, type Handlers, type Node } from '../../../foundation/view/Tree.model';
import type { Jack, PushInput } from '../../model/types';

/** Every port on the unit's back, left to right as the manual lists them. */
export const PORTS = ['Power', 'USB-C', 'USB-A', 'MIDI In', 'MIDI Out', 'ADAT In', 'ADAT Out', 'Pedal 1', 'Pedal 2', 'In 1', 'In 2', 'Out 1', 'Out 2', 'Phones'] as const;
export type Port = (typeof PORTS)[number];

/** What a plugged thing is called. */
const PLUGGED: Record<NonNullable<Jack['plugged']>, string> = { footswitch: 'a footswitch', expression: 'an expression pedal', cv: 'a CV cable', cable: 'a cable', headphones: 'headphones', device: 'a device' };

export interface RearPanelModelProps {
  /** What the app says is in each port, by the port's name. A port not named is empty. */
  jacks?: Partial<Record<Port, Jack>> | Record<string, Jack>;
  /** Called with the power button's down and up, as control `power`. */
  onInput?: (input: PushInput) => void;
  className?: string;
}

/** A port's spoken state: "Pedal 1: a footswitch connected", "ADAT In: nothing connected". */
export function portName(port: string, jack: Jack | undefined): string {
  return `${port}: ${jack?.plugged ? PLUGGED[jack.plugged] : 'nothing'} connected`;
}

function port(name: string, jack: Jack | undefined): Node {
  const plugged = jack?.plugged;
  return h(
    'li',
    { class: 'push-rear__port', 'data-port': name, 'data-plugged': plugged ?? 'none', 'aria-label': portName(name, jack) },
    component('StatusDot', { hue: plugged ? 'ok' : 'd', hollow: !plugged, glow: !!plugged }),
    textNode({ role: 'label', leading: 'tight', truncate: true }, { 'data-part': 'name' }, name),
    textNode({ role: 'caption', tone: 'muted', leading: 'tight', truncate: true }, { 'data-part': 'holds' }, plugged ? PLUGGED[plugged].replace(/^an? /, '') : (jack?.job ?? 'empty')),
  );
}

/** The tree RearPanel draws: the power button, then a list of the fourteen ports. */
export function rearPanelView({ jacks = {}, className }: RearPanelModelProps): Node {
  const all = jacks as Record<string, Jack | undefined>;
  return wire(
    h(
      'div',
      { class: ['push-rear', className].filter(Boolean).join(' '), role: 'group', 'aria-label': 'Push rear panel' },
      h('div', { class: 'push-rear__power', 'data-control': 'power', 'data-kind': 'button' }, component('Pad', { label: '⏻', name: 'Power', fillCell: true })),
      h('ul', { class: 'push-rear__ports' }, ...PORTS.map((name) => port(name, all[name]))),
    ),
    { bind: [['pushSurface', { onInput: 'input' }]] },
  );
}

export const rearPanelHandlers = (props: RearPanelModelProps): Handlers => ({ input: props.onInput });
