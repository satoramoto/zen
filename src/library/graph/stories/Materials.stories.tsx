// The shader materials, each in the graph editor beside a surface wearing it
// (docs/shader-graph.md, "Stories"). Turning a number updates the surface live; rewiring
// recompiles; the compiler's errors are listed. Meta draws the material as its own board's backdrop.
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { withLibraryTheme } from '../../storybook';
import { Segmented } from '../../components/core/Segmented/Segmented';
import type { Circuit } from '../model/circuit';
import { shaderChip } from '../../shader/nodes';
import { SHADER_MATERIALS } from '../../shader/materials';
import { SHADER_MATERIAL_NAMES, type ShaderMaterialName } from '../../shader/types';
import { MaterialLab } from './MaterialLab';

/** A small material to develop against: coord → warp → noise mixing two theme hues → fade → out. */
function playground(): Circuit {
  const t = (id: string, from: [string, string], to: [string, string], kind: string) => ({ id, from: { chip: from[0], pin: from[1] }, to: { chip: to[0], pin: to[1] }, kind });
  return {
    version: 1,
    board: 'board',
    modules: {
      board: {
        id: 'board',
        chips: [
          shaderChip('coord', 'coord', 0, 40),
          shaderChip('warp', 'warp', 220, 0, { amount: 0.6, scale: 1.2 }),
          shaderChip('noise', 'noise', 440, 0, { scale: 1.5 }),
          shaderChip('theme', 'deep', 440, 200, { slot: 'hue-1' }),
          shaderChip('theme', 'light', 440, 340, { slot: 'hue-3' }),
          shaderChip('mix', 'mix', 680, 140),
          shaderChip('fade', 'fade', 900, 140, { amount: 0.55 }),
          shaderChip('out', 'out', 1120, 160),
        ],
        traces: [
          t('t1', ['coord', 'p'], ['warp', 'p'], 'point'),
          t('t2', ['warp', 'p'], ['noise', 'p'], 'point'),
          t('t3', ['noise', 'n'], ['mix', 't'], 'number'),
          t('t4', ['deep', 'c'], ['mix', 'a'], 'colour'),
          t('t5', ['light', 'c'], ['mix', 'b'], 'colour'),
          t('t6', ['mix', 'c'], ['fade', 'c'], 'colour'),
          t('t7', ['fade', 'c'], ['out', 'c'], 'colour'),
        ],
        inPins: [],
        outPins: [],
      },
    },
  };
}

const meta: Meta = {
  title: 'Design OS/Graph/Materials',
  decorators: [withLibraryTheme],
  parameters: { layout: 'padded' },
};
export default meta;

const HOW =
  'Select a chip for a control per unwired number (dragging one updates the surface without recompiling); drag from an out pin to an in pin of the same kind to connect, click a cord and press Delete to remove it (either recompiles); the compiler’s errors are listed under the readout.';
const story = (line: string) => ({ docs: { description: { story: `${line} ${HOW}` } } });

type Root = HTMLElement;
const readout = (root: Root) => root.querySelector('[data-testid="material-readout"]')?.textContent ?? '';
const compiles = (root: Root) => Number(/compiled (\d+)/.exec(readout(root))?.[1] ?? NaN);

/**
 * The cheap behaviour every material story holds: the board is drawn, and selecting the first chip
 * with numbers then nudging its first control changes that value without a recompile. The surface
 * wears the shader wherever WebGL2 is allowed (not in a headless browser without it).
 */
async function tunesLive(root: Root) {
  const names = () => Array.from(root.querySelectorAll<HTMLElement>('[data-testid="material-board"] .lib-device [data-part="name"]'));
  // An empty circuit (a material not authored yet) has nothing to tune.
  await waitFor(() => expect(root.querySelector('[data-testid="material-readout"]')).not.toBeNull());
  const before = compiles(root);
  for (const name of names()) {
    await userEvent.click(name);
    const slider = await waitFor(() => within(root.querySelector<HTMLElement>('[data-testid="material-controls"]')!).getAllByRole('slider')[0], { timeout: 300 }).catch(() => null);
    if (!slider) continue;
    const was = slider.getAttribute('aria-valuenow');
    slider.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(slider.getAttribute('aria-valuenow')).not.toBe(was));
    expect(compiles(root)).toBe(before);
    return;
  }
}

function materialStory(name: ShaderMaterialName, line: string): StoryObj {
  const def = SHADER_MATERIALS[name];
  return {
    render: () => <MaterialLab initial={def.circuit} label={def.label} blurb={line} scale={def.scale} animate={def.animate} interactive={def.interactive} />,
    parameters: story(line),
    play: async ({ canvasElement }) => {
      await waitFor(() => expect(readout(canvasElement)).toMatch(/slots/));
      await tunesLive(canvasElement);
    },
  };
}

export const Water = materialStory('water', 'Caustic light over the layer, its field gently warped so it reads as refraction, and a ripple from a press.');
export const Ether = materialStory('ether', 'Gradient smoke from the theme’s hues, slow and turbulent (warped fBm), its colour drifting softly.');
export const Glass = materialStory('glass', 'Plain glass: translucency over the layer’s blur, a rim light and a subtle highlight; static, so it draws only on change.');

function MetaBoard({ start }: { start: ShaderMaterialName }) {
  const [from, setFrom] = useState<ShaderMaterialName>(start);
  const def = SHADER_MATERIALS[from];
  return (
    <MaterialLab
      key={from}
      meta
      initial={def.circuit}
      label={`Meta · ${def.label}`}
      blurb="The board’s own backdrop is the material built on it: edit the board and it restyles itself."
      scale={def.scale}
      animate={def.animate}
      interactive={def.interactive}
      headEnd={
        <Segmented
          items={SHADER_MATERIAL_NAMES}
          index={SHADER_MATERIAL_NAMES.indexOf(from)}
          onChange={(n) => setFrom(SHADER_MATERIAL_NAMES[n])}
          label="Start from"
        />
      }
    />
  );
}

export const Meta_: StoryObj<{ start: ShaderMaterialName }> = {
  name: 'Meta',
  args: { start: 'ether' },
  argTypes: { start: { control: 'select', options: SHADER_MATERIAL_NAMES } },
  render: ({ start }) => <MetaBoard key={start} start={start} />,
  parameters: story('A graph board whose backdrop is a `ShaderCanvas` drawing the material on that board, under a transparent graph; `start` (or the switch) picks the material it starts from.'),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(canvasElement.querySelector('[data-testid="material-ground"]')).not.toBeNull());
    await tunesLive(canvasElement);
  },
};

export const Playground: StoryObj = {
  render: () => (
    <MaterialLab
      initial={playground()}
      label="Playground"
      blurb="A small material: the coord warped, read as noise, mixing two theme hues, faded over the layer."
    />
  ),
  parameters: story('A small circuit to try the editor on.'),
  play: async ({ canvasElement }) => {
    const root = within(canvasElement);
    await waitFor(() => expect(readout(canvasElement)).toMatch(/^\d+ slots · \d+ lines · compiled 1×/));
    // A number edit: the Fade amount moves, the surface's params follow, nothing recompiles.
    await userEvent.click(await root.findByRole('button', { name: /^Fade\b/ }));
    const amount = await root.findByRole('slider', { name: 'Fade Amount' });
    amount.focus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => expect(Number(amount.getAttribute('aria-valuenow'))).toBeGreaterThan(0.55));
    expect(compiles(canvasElement)).toBe(1);
    // The surface wears the shader where WebGL2 is allowed.
    const surface = canvasElement.querySelector('[data-testid="material-surface"]')!;
    if (surface.querySelector('canvas')) expect(surface).toHaveAttribute('data-shader');
  },
};
