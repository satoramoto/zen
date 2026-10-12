import type { StorybookConfig } from '@storybook/react-vite';
// The field guide and the library's own components. The Yahaha redesigns have their own
// Storybook (.storybook-yahaha/).
const config: StorybookConfig = {
  stories: ['../src/stories/**/*.stories.@(ts|tsx)', '../src/library/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
  core: { disableTelemetry: true },
};
export default config;
