// The solver's principles in Svelte: React's `useScopePrinciples` over the same pure
// `scopePrinciples` (principles.ts), reading the nearest ThemeScope (`getThemeScope`).
import { getThemeScope } from '../../svelte/theme.svelte';
import { scopePrinciples as resolve } from './principles';
import type { Principles } from './types';

/**
 * The nearest ThemeScope's principles resolved (the first pack's outside one), or `given()` when
 * it returns some. `current` is reactive and recomputed only when the scope or `given` changes.
 * Call it while a component initialises.
 */
export function scopePrinciples(given?: () => Principles | undefined): { readonly current: Principles } {
  const scope = getThemeScope();
  const principles = $derived(resolve(scope, given?.()));
  return {
    get current() {
      return principles;
    },
  };
}
