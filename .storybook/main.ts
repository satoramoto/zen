import type { StorybookConfig } from '@storybook/react-vite';
// The Yahaha widget baseline (yahaha/) is a Svelte Storybook, composed in as a ref: served by
// `npm run dev` in development, built into storybook-static/yahaha for the static build.
const yahahaPort = process.env.YAHAHA_STORYBOOK_PORT ?? '6022';
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
  core: { disableTelemetry: true },
  refs: (_, { configType }) => ({
    yahaha: { title: 'Yahaha baseline', url: configType === 'DEVELOPMENT' ? `http://127.0.0.1:${yahahaPort}` : './yahaha' },
  }),
};
export default config;
