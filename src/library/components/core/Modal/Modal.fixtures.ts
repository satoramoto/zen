// Modal's and Sheet's stories as plain props: Modal.stories.tsx draws them (with either renderer's
// `Tree`), and the tree snapshot (`src/library/view/snapshot.test.ts`) prints every instance. The
// body is the fixture's `children` text; a story with actions is a view tree (`modalSample`): a
// Modal, by name, with buttons in its `actions` slot.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import { focusRing } from '../../../primitives/Ring';
import { textNode } from '../../../primitives/Text.model';
import { component, h, wire, type Node } from '../../../view/Tree.model';
import type { ModalModelProps, SheetModelProps } from './Modal.model';

/** The controls. */
export const modalArgTypes = { width: { control: { type: 'number', min: 200, max: 900 } } } as const;

/** The Delete take question. Every Modal story starts from it. */
const question: FixtureProps<ModalModelProps> = {
  title: 'Delete take',
  children: 'The take and its stems are deleted for good. Anything that plays it stops.',
};

export const modalStories = defineFixtures<ModalModelProps>()({
  /** Drawn as a tree with its actions (`modalSample`). */
  WithActions: { args: question },
  NoActions: { args: question },
  Labelled: { args: { ...question, title: 'Export', label: 'Export stems', children: 'Each part to its own file.' } },
  Wide: { args: { ...question, width: 620 } },
});

export const sheetStories = defineFixtures<SheetModelProps>()({
  Right: { args: { title: 'Settings', side: 'right', modal: true, children: 'Setting 1' } },
  Bottom: { args: { title: 'More effects', side: 'bottom', modal: false, children: 'Effect 1' } },
});

/** An `ActionButton`'s DOM (its root and its `ButtonFace`) as tree nodes: a click calls `act`. */
const actionButton = (label: string, tone: 'normal' | 'danger'): Node =>
  h(
    'div',
    { class: 'lib-action-button' },
    wire(
      textNode(
        { as: 'button', role: 'label', leading: 'tight', case: 'none', className: `lib-action-button-face ${focusRing}` },
        { 'data-part': 'face', type: 'button', 'data-kind': 'button', 'data-tone': tone },
        label,
      ),
      { on: { click: 'act' } },
    ),
  );

/** The WithActions story's tree: a Modal (by name; `onClose` the `close` handler) with its body
 *  text and Delete (danger) and Keep in its `actions` slot. */
export const modalSample = (args: FixtureProps<ModalModelProps>): Node =>
  component(
    'Modal',
    { title: args.title, label: args.label, width: args.width, className: args.className },
    { on: { onClose: 'close' }, slots: { children: [args.children ?? ''], actions: [actionButton('Delete', 'danger'), actionButton('Keep', 'normal')] } },
  ) as unknown as Node;
