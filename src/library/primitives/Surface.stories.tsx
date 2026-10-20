import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../storybook';
import { treeStory, withRenderer } from '../stories/story';
import { component, h, styleText } from '../view/Tree.model';
import { surfaceNode } from './Surface.model';
import { textNode } from './Text.model';
import { GRID_LAYERS, GRID_MATERIALS, surfaceArgTypes, surfaceArgs, surfaceCaption, surfaceProps, surfaceStories as s, type SurfaceArgs } from './Surface.fixtures';

// The args, controls and each story's surfaces come from Surface.fixtures.ts, which the parity test
// shares. Each story is a view tree (`surfaceNode`, `textNode`), so the toolbar's Renderer draws it
// in React or Svelte; a tree surface draws its CSS layer, no shader. Shader draws `Surface` components,
// which draw the shader in either renderer.
const specimen = {
  width: 'calc(var(--control-h) * 3)',
  height: 'calc(var(--control-h) * 2)',
  display: 'flex',
  'align-items': 'center',
  'justify-content': 'center',
};
const specimenStyle = styleText(specimen);

const meta: Meta<SurfaceArgs> = {
  title: 'Design OS/Primitives/Surface',
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  args: surfaceArgs,
  argTypes: surfaceArgTypes,
};
export default meta;
type Story = StoryObj<SurfaceArgs>;

/** One specimen: every control changes it. */
export const Playground: Story = treeStory((args: SurfaceArgs) => ({
  tree: h(
    'div',
    { style: 'padding: var(--space-6)' },
    surfaceNode(surfaceProps(args), { style: specimenStyle }, textNode({ role: 'label', tone: 'secondary' }, {}, surfaceCaption(args.layer, args.material))),
  ),
}));

/** Every layer (rows) wearing every material (columns), with the no-layer row and no-material column. */
export const LayersByMaterials: Story = {
  name: 'Layers × materials',
  ...treeStory(() => {
    const items = s.LayersByMaterials.items ?? [];
    return {
      tree: h(
        'div',
        { style: 'padding: var(--space-4); overflow-x: auto' },
        h(
          'div',
          { style: `display: grid; grid-template-columns: auto repeat(${GRID_MATERIALS.length}, auto); gap: var(--space-4); align-items: center` },
          h('span'),
          GRID_MATERIALS.map((m) => textNode({ role: 'caption', tone: 'muted' }, {}, m ?? 'no material')),
          GRID_LAYERS.map((l, row) =>
            h(
              'div',
              { style: 'display: contents' },
              textNode({ role: 'caption', tone: 'muted' }, {}, l ?? 'no layer'),
              items
                .slice(row * GRID_MATERIALS.length, (row + 1) * GRID_MATERIALS.length)
                .map(({ children, ...props }) => surfaceNode(props, { style: specimenStyle }, textNode({ role: 'caption', tone: 'secondary' }, {}, children ?? ''))),
            ),
          ),
        ),
      ),
    };
  }),
};

/** Something with texture behind the panes, so their blur and tint read: the palette's hues as
 *  bands and dots. */
const busy = {
  padding: 'var(--space-6)',
  background: [
    'radial-gradient(circle at 20% 30%, var(--hue-1) 0 12%, transparent 13%)',
    'radial-gradient(circle at 70% 60%, var(--hue-3) 0 16%, transparent 17%)',
    'repeating-linear-gradient(115deg, var(--hue-2) 0 var(--space-3), transparent var(--space-3) calc(var(--space-3) * 3))',
    'linear-gradient(var(--hue-4), var(--surface-0))',
  ].join(', '),
};

/** A float and an overlay pane wearing each shader material, and `false` (the CSS layer alone),
 *  over a busy ground. Where the shader can't draw (no WebGL2, reduced motion or transparency) or
 *  a material is still empty, every pane shows its layer's CSS look: that must already be finished.
 *  The panes are `Surface` components in the tree, so the toolbar's Renderer draws them with React's
 *  or Svelte's Surface, and both draw the shader canvas. */
export const Shader: Story = treeStory(() => ({
  tree: h(
    'div',
    { style: `padding: ${busy.padding}; background: ${busy.background}` },
    h(
      'div',
      { style: 'display: grid; grid-template-columns: repeat(auto-fill, minmax(calc(var(--control-h) * 4), 1fr)); gap: var(--space-4)' },
      (s.Shader.items ?? []).map(({ children, ...props }) =>
        component(
          'Surface',
          { ...props, style: styleText({ ...specimen, width: 'auto', 'flex-direction': 'column' }) },
          {
            key: `${props.layer}-${String(props.shader)}`,
            slots: {
              children: [textNode({ role: 'label' }, {}, children ?? ''), textNode({ role: 'caption', tone: 'muted' }, {}, props.layer ?? '')],
            },
          },
        ),
      ),
    ),
  ),
}));

/** Keys at rest, pressed, lit in each slot, and bordered. */
export const States: Story = treeStory(() => ({
  tree: h(
    'div',
    { style: 'padding: var(--space-4); display: flex; flex-wrap: wrap; gap: var(--space-4)' },
    (s.States.items ?? []).map(({ children, ...props }) => surfaceNode(props, { style: specimenStyle }, textNode({ role: 'label' }, {}, children ?? ''))),
  ),
}));
