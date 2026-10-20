import type { StorybookConfig } from '@storybook/svelte-vite';

// The Svelte Storybook: the library's Svelte renderers (`*.stories.svelte.ts`, the same story names
// and args as each component's React stories). `npm run storybook:svelte` serves it on 6023, and
// the React Storybook (`.storybook/`) composes it as a ref while it is running.
const config: StorybookConfig = {
  stories: ['../src/library/**/*.stories.svelte.ts'],
  // `*.stories.svelte.ts` are CSF files the React Storybook's glob never matches; Storybook's CSF
  // indexer only claims `.stories.ts`, so it is lent to them here.
  experimental_indexers: async (indexers = []) => {
    const csf = indexers.find((indexer) => indexer.test.test('x.stories.ts'));
    if (!csf) throw new Error('No CSF indexer to read *.stories.svelte.ts with.');
    return [...indexers, { test: /\.stories\.svelte\.ts$/, createIndex: csf.createIndex }];
  },
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/svelte-vite', options: {} },
  core: {
    disableTelemetry: true,
    // Its own Vite config (the Svelte plugin), not the app's React one.
    builder: { name: '@storybook/builder-vite', options: { viteConfigPath: '.storybook-svelte/vite.config.ts' } },
  },
};
export default config;
