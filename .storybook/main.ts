import type { StorybookConfig } from '@storybook/react-vite';
// The one Storybook: the field guide, the library's own components, and the Yahaha redesigns on
// the library's token contract (primitives, the Stage's regions and the Stage itself).
const config: StorybookConfig = {
  stories: [
    '../src/stories/**/*.stories.@(ts|tsx)',
    '../src/library/**/*.stories.@(ts|tsx)',
  ],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
  core: { disableTelemetry: true },
};
export default config;
