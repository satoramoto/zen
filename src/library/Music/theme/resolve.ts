import { instrumentScheme, type Facets, type Mode } from '../../contract';
import { MIXFLOW_SOURCE_ROLES } from '../../themes/mixflow-reference';
import type { MixerTheme } from '../mixer/model';

/** The reference label treatment; caption comes from the current scope, not a fixed grey. */
export const identityLabel = (ink: string, caption = 'var(--caption)') => `color-mix(in srgb, ${ink} 45%, ${caption})`;

const LETTERS = ['a', 'b', 'c', 'd'] as const;

/** A mixer theme that follows CSS inheritance live. Use inside .zen-music; no context or
 * renderer hook is needed, and both the React and Svelte view trees consume the same props. */
export function musicMixerTheme(deckIds: readonly string[] = LETTERS): MixerTheme {
  return {
    primary: 'var(--primary)', signal: 'var(--signal)',
    stems: Object.fromEntries(MIXFLOW_SOURCE_ROLES.map((role) => [role, `var(--stem-${role})`])),
    decks: Object.fromEntries(deckIds.map((id, i) => {
      const letter = LETTERS[i % LETTERS.length];
      return [id, { ink: `var(--deck-${letter})`, waveform: `var(--deck-${letter}-waveform)` }];
    })),
  };
}

/** Colour-valued counterpart for hosts which already have resolved facets. Material and palette
 * swaps are honoured, and no old mixflow default is injected when another palette is worn. */
export function resolveMusicTheme(facets: Facets, mode: Mode, deckIds: readonly string[] = LETTERS) {
  const p = facets.palette[mode], instrument = instrumentScheme(p);
  const strength = facets.materials.instrument?.waveformStrength ?? '65%';
  const colors = {
    primary: p.action, signal: instrument.signal,
    ...Object.fromEntries(MIXFLOW_SOURCE_ROLES.map((role, i) => [role, instrument.sources[i]])) as Record<(typeof MIXFLOW_SOURCE_ROLES)[number], string>,
    left: instrument.decks[0], right: instrument.decks[2],
  };
  const deckPairs = instrument.decks.map((ink) => ({ ink, waveform: `color-mix(in srgb, ${ink} ${strength}, ${instrument.waveformBase})` }));
  const mixer: MixerTheme = {
    primary: colors.primary, signal: colors.signal, stems: colors,
    decks: Object.fromEntries(deckIds.map((id, i) => [id, deckPairs[i % deckPairs.length]])),
  };
  return { colors, deckPairs, mixer, waveformBase: instrument.waveformBase, waveformSilence: instrument.idle };
}
