// The Svelte Storybook's Vite config: Svelte's plugin only (the React Storybook uses the root vite.config.ts).
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({ plugins: [svelte()] });
