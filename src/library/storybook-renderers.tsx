// The Storybook entry for parts built as view trees: `@satoramoto/zen/storybook/renderers`. The
// Renderer toolbar's decorator and the helpers that build a part's stories from its fixtures, so an
// app's Storybook plays every story in React and in Svelte as zen's does. Its own entry, apart from
// `@satoramoto/zen/storybook`, because it needs Svelte, which a React-only app does not install.

/** Draws a story with React's `Tree`, or with the Renderer toolbar on Svelte, mounts its Svelte part. */
export { withRenderer, fixtureStories, treeStory, type StoryView } from './foundation/stories/story';
/** A part's story args as plain data, every story built from them. */
export { defineFixtures, instances, type Fixtures, type StoryFixture, type FixtureProps } from './fixtures';
/** The Renderer toolbar global. */
export { rendererGlobalTypes, rendererInitialGlobals } from './storybook.globals';
