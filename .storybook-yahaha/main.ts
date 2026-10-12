import type { StorybookConfig } from '@storybook/react-vite';
// The Yahaha redesigns on the library's token contract: primitives, the Stage's regions and
// the Stage itself, and nothing else.
const config: StorybookConfig = {
  stories: ['../src/library/yahaha/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
  core: { disableTelemetry: true },
};
export default config;
