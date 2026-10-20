// The solver's principles from a theme scope, framework-free: React's `useScopePrinciples`
// (AssembledScreen.tsx) and Svelte's `scopePrinciples` (principles.svelte.ts) both call this.
import type { Facets, PackPrinciples } from '../../contract';
import { packs } from '../../themes/packs';
import type { Principles } from './types';
import { principlesFor } from './units';

/** What a theme scope gives: its facets and its pack's principles. */
export interface PrinciplesScope {
  readonly facets: Facets;
  readonly principles?: PackPrinciples;
}

/**
 * `given`, or the scope's principles resolved: its facets with its pack's principles (else the
 * pack those facets come from, else the first pack's); outside a scope, the first pack's.
 */
export function scopePrinciples(scope: PrinciplesScope | null | undefined, given?: Principles): Principles {
  if (given) return given;
  const facets = scope?.facets ?? packs[0].facets;
  const pack: PackPrinciples = scope?.principles ?? packs.find((p) => p.facets === facets)?.principles ?? packs[0].principles;
  return principlesFor(facets, pack);
}
