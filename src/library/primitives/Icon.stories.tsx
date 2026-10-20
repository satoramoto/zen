import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../storybook';
import { treeStory, withRenderer } from '../stories/story';
import { h } from '../view/Tree.model';
import { iconNode } from './Icon.model';
import { textNode } from './Text.model';
import { iconArgTypes, iconArgs, iconProps, iconStories as s, type IconArgs } from './Icon.fixtures';

// The args, controls and each story's icons come from Icon.fixtures.ts, which the parity test
// shares. Each story is a view tree (`iconNode`, `textNode`), so the toolbar's Renderer draws it in
// React or Svelte.

/** A play triangle and a stop square: one stroked, one filled. */
const play = () => h('path', { d: 'M7 5l12 7-12 7z' });
const stop = () => h('rect', { x: '6', y: '6', width: '12', height: '12', rx: '1', fill: 'currentColor', stroke: 'none' });

const meta: Meta<IconArgs> = {
  title: 'Design OS/Primitives/Icon',
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: iconArgs,
  argTypes: iconArgTypes,
};
export default meta;
type Story = StoryObj<IconArgs>;

/** One icon: every control changes it. */
export const Playground: Story = treeStory((args: IconArgs) => ({
  tree: h('div', { style: 'padding: var(--space-4)' }, iconNode(iconProps(args), {}, play())),
}));

/** Every size, beside text in the same role so the two line up. */
export const Sizes: Story = treeStory(() => ({
  tree: h(
    'div',
    { style: 'padding: var(--space-4); display: grid; gap: var(--space-3)' },
    (s.Sizes.items ?? []).map(({ size = 'body' }) =>
      h(
        'div',
        { style: 'display: flex; align-items: center; gap: var(--space-2)' },
        iconNode({ size }, {}, play()),
        iconNode({ size }, {}, stop()),
        textNode({ role: size === 'control' ? 'body' : size }, {}, size),
      ),
    ),
  ),
}));

/** Every tone. */
export const Tones: Story = treeStory(() => ({
  tree: h(
    'div',
    { style: 'padding: var(--space-4); display: flex; flex-wrap: wrap; gap: var(--space-4)' },
    (s.Tones.items ?? []).map((props) =>
      h(
        'div',
        { style: 'display: grid; justify-items: center; gap: var(--space-1)' },
        iconNode(props, {}, play()),
        textNode({ role: 'caption', tone: 'muted' }, {}, String(props.tone)),
      ),
    ),
  ),
}));
