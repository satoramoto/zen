import type { ComponentType } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { instances, type StoryFixture } from '../fixtures';
import { Hole, Opaque } from '../primitives/Surface';
import { withLibraryTheme } from '../storybook';
import { Layer } from './Layer';
import { holeStories, layerArgTypes, layerStories, opaqueStories } from './Layer.fixtures';

// Every story's args come from Layer.fixtures.ts, which the Svelte stories and the parity test share.
const meta: Meta = {
  title: 'Design OS/Layout/Layer',
  decorators: [withLibraryTheme],
  parameters: { layout: 'centered' },
  argTypes: layerArgTypes,
};
export default meta;
type Story = StoryObj;

/** A fixture's instances in a wrapping row (one instance: just it), its args from the controls. */
const row =
  <P,>(Drawn: ComponentType<any>, fixture: StoryFixture<P>): Story['render'] =>
  (args) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--space-2)' }}>
      {instances({ ...fixture, args: { ...fixture.args, ...args } as StoryFixture<P>['args'] }).map((props, i) => (
        <Drawn key={i} {...props} />
      ))}
    </div>
  );

/** Every level of the depth stack as a Layer (a `Surface` with a `layer` and card corners). */
export const Levels: Story = { render: row(Layer, layerStories.Levels) };

/** A popover's surface: `float`, with its role and name, taking the right of the picture's light. */
export const Popover: Story = { args: layerStories.Popover.args, render: row(Layer, layerStories.Popover) };

/** Opaque: every layer inside draws its solid fill and no backdrop. */
export const OpaqueScope: Story = { name: 'Opaque', args: opaqueStories.OpaqueScope.args, argTypes: { level: { table: { disable: true } } }, render: row(Opaque, opaqueStories.OpaqueScope) };

/** Hole: a cut-out through every layer to what's behind the page; it paints nothing. */
export const HoleCutOut: Story = { name: 'Hole', argTypes: { level: { table: { disable: true } } }, render: row(Hole, holeStories.HoleCutOut) };
