// RackCell's model: its props (all but the mark, a React node or a Svelte snippet) and the view it
// draws from them. No framework: `RackCell.tsx` (React) and `RackCell.svelte` (Svelte) both render
// `rackCellView`.
import { focusRing } from '../../../primitives/Ring';
import type { ElementView, TextModelProps } from '../../../primitives/Text.model';

export interface RackCellModelProps {
  /** The rack's name ("Sunday drive"). Empty: "No rack". */
  rack: string;
  /** The Quick Rack slot it's on ("A1"). Empty: no slot shown. */
  slot?: string;
  /** The small word before the slot. */
  label?: string;
  /** The accessible name. Default: "Rack: Sunday drive, on Quick Rack A1. Opens the Rack page". */
  name?: string;
  /** The tooltip key, set as `data-tip`. */
  tip?: string;
  /** Called on a click, Space or Enter (opens the Rack page). */
  onPress?: () => void;
}

/** A Text element's view: its Text props, its class and its other attributes. */
export interface TextPartView extends ElementView {
  text: TextModelProps;
}

/** What a renderer draws. */
export interface RackCellView {
  /** The cell `<div>`'s class. */
  rootClassName: string;
  /** The one `<button>`. */
  button: ElementView;
  /** The caption line (a label Text). */
  head: TextPartView;
  /** The small word `<span>`. */
  label: { className: string; label: string };
  /** The separator `<span>` and the slot (a label Text), or null when there is no slot. */
  slot: { separator: ElementView & { char: string }; value: TextPartView & { label: string } } | null;
  /** The name line (a caption Text). */
  name: TextPartView;
  /** The rack's name, or "No rack" (a caption Text). */
  title: TextPartView & { label: string };
  /** The mark's `<span>` class (drawn only when there is a mark). */
  markClassName: string;
}

/** The cell RackCell draws from its props. */
export function rackCellView({ rack, slot = '', label = 'Rack', name, tip }: RackCellModelProps): RackCellView {
  const empty = rack.trim() === '';
  const shown = empty ? 'No rack' : rack;
  return {
    rootClassName: 'yh-rack-cell',
    button: {
      className: `yh-rack-cell__button ${focusRing}`,
      attrs: {
        type: 'button',
        'aria-label': name ?? `${label}: ${shown}${slot ? `, on Quick Rack ${slot}` : ''}. Opens the Rack page`,
        'data-tip': tip,
      },
    },
    head: { text: { role: 'label', size: 'caption', tabular: true }, className: 'yh-rack-cell__head', attrs: {} },
    label: { className: 'yh-rack-cell__label', label },
    slot: slot
      ? {
          separator: { className: 'yh-rack-cell__separator', attrs: { 'aria-hidden': 'true' }, char: '·' },
          value: { text: { role: 'label', case: 'none', tabular: true }, className: 'yh-rack-cell__slot', attrs: {}, label: slot },
        }
      : null,
    name: {
      text: { role: 'caption', size: 'body', tabular: true },
      className: 'yh-rack-cell__name',
      attrs: { 'data-empty': empty ? 'true' : undefined },
    },
    title: {
      text: { role: 'caption', size: empty ? 'caption' : 'body', tabular: true },
      className: 'yh-rack-cell__title',
      attrs: {},
      label: shown,
    },
    markClassName: 'yh-rack-cell__mark',
  };
}
