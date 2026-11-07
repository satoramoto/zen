import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { sharedAliases } from './vite.aliases';
// Svelte compiles the Svelte renderers (`*.svelte`, `*.svelte.ts`) for the parity test; svelteTesting
// resolves Svelte's browser build and cleans up after each test.
export default defineConfig({
  plugins: [react(), svelte(), svelteTesting()],
  resolve: { alias: sharedAliases },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test-setup.ts'], include: ['src/**/*.test.{ts,tsx}'] },
});
