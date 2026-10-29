import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';
import { transformWithOxc } from 'vite';
import type { Plugin } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

/** The Claude Code harness's engine-side TSX: JSX against the global `h` and `Fragment`, as the engine compiles it, never React's runtime. */
const ENGINE_JSX = /\/src\/harness\/claude-code\/(kit|sample)\/.*\.tsx$/;

/** Compiles the harness's engine JSX (classic, `h`/`Fragment`) before Vite's own transform, which then finds no JSX left in it. */
const engineJsx = (): Plugin => ({
  name: 'zen:harness-engine-jsx',
  enforce: 'pre',
  async transform(code, id) {
    const file = id.split('?')[0];
    if (!ENGINE_JSX.test(file)) return null;
    const out = await transformWithOxc(code, file, { lang: 'tsx', jsx: { runtime: 'classic', pragma: 'h', pragmaFrag: 'Fragment' } });
    return { code: out.code, map: out.map };
  },
});

// The one Storybook: the field guide, the library's own components, the Yahaha redesigns on
// the library's token contract (primitives, the Stage's regions and the Stage itself), and the
// harnesses (the Claude Code kit and a sample mod, drawn by its bench).
const config: StorybookConfig = {
  stories: [
    '../src/stories/**/*.stories.@(ts|tsx)',
    '../src/library/**/*.stories.@(ts|tsx)',
    '../src/harness/**/*.stories.@(ts|tsx)',
    ...(process.env.OMARCHY_PLUGIN_SOURCE ? [`${process.env.OMARCHY_PLUGIN_SOURCE}/preview/**/*.stories.@(ts|tsx)`] : []),
  ],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: { name: '@storybook/react-vite', options: {} },
  core: { disableTelemetry: true },
  viteFinal: async (config) => {
    // Svelte's plugin too: the Renderer toolbar draws view-tree components with the Svelte `Tree`.
    config.plugins = [engineJsx(), ...(config.plugins ?? []), svelte()];
    config.resolve ??= {};
    // The harness's sample mod imports its atoms from 'claude-code', as a mod does: here, the bench's stand-in engine.
    config.resolve.alias = {
      ...(config.resolve.alias as Record<string, string>),
      'claude-code': fileURLToPath(new URL('../src/harness/claude-code/bench/engine.ts', import.meta.url)),
      '@omarchy': fileURLToPath(new URL('../src/harness/omarchy', import.meta.url)),
    };
    if (process.env.OMARCHY_PLUGIN_SOURCE) {
      config.server ??= {};
      config.server.fs ??= {};
      config.server.fs.allow = [...(config.server.fs.allow ?? []), fileURLToPath(new URL('..', import.meta.url)), process.env.OMARCHY_PLUGIN_SOURCE];
    }
    return config;
  },
};
export default config;
