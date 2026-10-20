// Story helper (not shipped): a Svelte story from a fixture. `const story = fixtureStory(Button)`,
// then `export const Board: Story = story(buttonStories.Board)`: a fixture with `items` renders
// them in a `Row`, one with `args` alone renders the component with those args (a string
// `children` as its text).
import type { Component } from 'svelte';
import type { StoryFixture } from '../../fixtures';
import Render from './Render.svelte';
import Row from './Row.svelte';

/** A Svelte story (CSF) object for a fixture: `args`, and a `render` returning `{ Component, props }`. */
export interface FixtureStory {
  args?: Record<string, unknown>;
  render: (args: Record<string, unknown>) => { Component: Component<any>; props: Record<string, unknown> };
}

/** `component` is a `.svelte` file's default export. */
export function fixtureStory(component: unknown) {
  return <P>(fixture: StoryFixture<P>): FixtureStory => ({
    args: fixture.args as Record<string, unknown> | undefined,
    render: (args) =>
      fixture.items
        ? { Component: Row as Component<any>, props: { component, args, items: fixture.items } }
        : { Component: Render as Component<any>, props: { component, props: args } },
  });
}
