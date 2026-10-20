import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../../storybook';
import { withRenderer } from '../../stories/story';
import { Text } from '../../primitives/Text';
import { Stack } from '../../primitives/Stack';
import { Region } from '../Region';
import { Screen } from '../Screen';
import { DEMO_NAME, DEMO_SPECS, NOW_FORMS, PAD_FORMS, SIDE_FORMS, demoArgTypes, demoArgs, demoStoryArgs, type DemoAspect } from './Assembly.fixtures';
import { useForm } from './forms';
import type { Placement } from './types';

// Each demo part declares its forms (Assembly.fixtures.ts) and reads the chosen one with
// useForm(); the screen is only DEMO_SPEC. There is no screen CSS: drag the frame's corner.

function Now() {
  const form = useForm(NOW_FORMS);
  return (
    <Stack gap={1}>
      <Text role="caption" tone="muted">Now playing · {form}</Text>
      <Text role={form === 'full' ? 'display' : 'heading'}>Main B</Text>
      {form === 'full' && <Text role="body">Next: Main C, fill after bar 4</Text>}
    </Stack>
  );
}

function Side() {
  const form = useForm(SIDE_FORMS);
  return form === 'docked' ? (
    <Stack gap={1}>
      <Text role="caption" tone="muted">Library · docked</Text>
      <Text role="body">Styles</Text>
      <Text role="body">Sounds</Text>
    </Stack>
  ) : (
    <Text role="caption" tone="muted">rail</Text>
  );
}

function Pads() {
  const form = useForm(PAD_FORMS);
  const rows = form === 'two-rows' ? 2 : 1;
  return (
    <Stack gap={1}>
      <Text role="caption" tone="muted">Pads · {form}</Text>
      {Array.from({ length: rows }, (_, r) => (
        <Stack key={r} direction="row" gap={1}>
          {Array.from({ length: 8 }, (_, i) => (
            <Text key={i} role="label">{r * 8 + i + 1}</Text>
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

/** The demo screen with no aspect, or locked to 16:9 (`DEMO_SPECS`, Assembly.fixtures.ts). */
function Demo({ width, height, aspect = 'none' }: { width: number; height: number; aspect?: DemoAspect }) {
  const [placement, setPlacement] = useState<Placement | null>(null);
  return (
    <div style={{ padding: 16, display: 'grid', gap: 12 }}>
      <Text role="caption" tone="muted">
        {placement
          ? `room ${Math.round(placement.room.w)} × ${Math.round(placement.room.h)}${placement.scale !== 1 ? ` at ${placement.scale.toFixed(3)}` : ''} · zoom ${placement.zoom.toFixed(3)}${placement.overflow ? ' (overflow)' : ''} · ${Object.values(placement.regions)
              .map((r) => `${r.id} ${r.form}`)
              .join(' · ')}${placement.steps.length ? ` · steps: ${placement.steps.join('; ')}` : ''}`
          : '…'}
      </Text>
      {/* The frame is the room: resize it by its corner, or with the width and height controls. */}
      <div key={`${width}x${height}`} style={{ width, height, resize: 'both', overflow: 'hidden', outline: '1px dashed var(--border)' }}>
        <Screen
          name={DEMO_NAME}
          spec={DEMO_SPECS[aspect]}
          onPlacement={setPlacement}
          regions={{
            bar: <Text role="label">Bar</Text>,
            now: (
              <Region name="Now">
                <Now />
              </Region>
            ),
            side: (
              <Region name="Library">
                <Side />
              </Region>
            ),
            pads: (
              <Region name="Pads">
                <Pads />
              </Region>
            ),
          }}
        />
      </div>
    </div>
  );
}

/**
 * React only (Renderer on Svelte shows a note): the demo's parts are components of the story's own
 * that read their form with `useForm`, and the caption shows the placement `onPlacement` reports,
 * so the story is a layout of its own rather than a fixture or a view tree.
 */
const meta: Meta<typeof Demo> = {
  title: 'Design OS/Layout/Assembly',
  decorators: [withRenderer, withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  component: Demo,
  args: demoArgs,
  argTypes: demoArgTypes,
};
export default meta;

type Story = StoryObj<typeof Demo>;

/** One spec, three forms per part, any room: the screen assembles itself. Drag the frame's corner. */
export const Resizable: Story = { args: demoStoryArgs.Resizable };
/** The 1440 × 900 board: every part at its richest form. */
export const Board: Story = { args: demoStoryArgs.Board };
/** A short room: the pads go to one row before anything else. */
export const Short: Story = { args: demoStoryArgs.Short };
/** Tighter still: every part at its last form; what's playing goes last. */
export const Small: Story = { args: demoStoryArgs.Small };
/**
 * Locked to 16:9 (`aspect: { ratio: 16 / 9, fit: 'contain' }`): drag the frame's corner and the
 * screen keeps its shape, laid out in the largest 16:9 room inside, the rest ground bands. A
 * smaller room steps forms down, as an app does.
 */
export const AspectLocked: Story = { args: demoStoryArgs.AspectLocked };
/**
 * Scaled (`fit: 'scale'`, design 1600 × 900): the screen is laid out once at its design room and
 * drawn smaller to the largest 16:9 box in the frame. Drag the corner: the forms never change.
 */
export const AspectScaled: Story = { args: demoStoryArgs.AspectScaled };
