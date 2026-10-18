import type { HueSlot } from '../components/core/hue';
import { Stack } from '../primitives/Stack';
import { Text } from '../primitives/Text';
import './Mark.css';

/** How firmly a claim stands, strongest first. */
export const STANDINGS = ['established', 'consequence', 'interpretation', 'conjecture', 'speculation'] as const;
export type Standing = (typeof STANDINGS)[number];

type Shape = 'disc' | 'square' | 'half' | 'triangle' | 'ring';

/**
 * What each standing looks like: a shape (the primary channel, so it reads without colour) and a
 * colour slot. The Compendium's own meaning map, the way `yahaha/hues.ts` is Yahaha's: filled
 * shapes are settled, hollow ones are open.
 */
export const STANDING_LOOK: Record<Standing, { shape: Shape; slot: HueSlot | 'role-2'; label: string }> = {
  established: { shape: 'disc', slot: 1, label: 'Established' },
  consequence: { shape: 'square', slot: 2, label: 'Mathematical consequence' },
  interpretation: { shape: 'half', slot: 3, label: 'Interpretation' },
  conjecture: { shape: 'triangle', slot: 4, label: 'Conjecture' },
  speculation: { shape: 'ring', slot: 'role-2', label: 'Speculation' },
};

function Glyph({ shape }: { shape: Shape }) {
  return (
    <svg viewBox="0 0 12 12" className="cmp-mark__glyph" aria-hidden="true" focusable="false">
      {shape === 'disc' && <circle cx="6" cy="6" r="4.5" className="cmp-mark__fill" />}
      {shape === 'square' && <rect x="2" y="2" width="8" height="8" className="cmp-mark__fill" />}
      {shape === 'half' && (
        <>
          <circle cx="6" cy="6" r="4" className="cmp-mark__line" />
          <path d="M6 2 A4 4 0 0 0 6 10 Z" className="cmp-mark__fill" />
        </>
      )}
      {shape === 'triangle' && <path d="M6 1.8 L10.4 9.8 L1.6 9.8 Z" className="cmp-mark__line" />}
      {shape === 'ring' && <circle cx="6" cy="6" r="4" className="cmp-mark__line cmp-mark__line--dashed" />}
    </svg>
  );
}

export interface MarkProps {
  standing: Standing;
  /** `margin` (default) hangs it in the reading page's left gutter beside its line; `inline` sits in the text (the legend). */
  place?: 'margin' | 'inline';
}

/**
 * **Job.** (Compendium mockup stub.) A margin mark for a claim's epistemic standing: a shape and a
 * colour slot (`STANDING_LOOK`), never colour alone. Put it at the start of the claim inside a
 * `Reading` paragraph; it floats into the left gutter beside that line. Its accessible name is
 * the standing.
 */
export function Mark({ standing, place = 'margin' }: MarkProps) {
  const look = STANDING_LOOK[standing];
  return (
    <Text
      tone={look.slot}
      className="cmp-mark"
      data-place={place}
      data-shape={look.shape}
      ariaRole="img"
      aria-label={look.label}
      title={look.label}
    >
      <Glyph shape={look.shape} />
    </Text>
  );
}

/** The key to the marks: every standing, its shape and its name. */
export function MarkLegend() {
  return (
    <Stack as="ul" direction="row" gap={4} wrap className="cmp-mark-legend" aria-label="Standing of claims">
      {STANDINGS.map((s) => (
        <Stack as="li" key={s} direction="row" gap={1} align="center">
          <Mark standing={s} place="inline" />
          <Text role="caption" tone="secondary">
            {STANDING_LOOK[s].label}
          </Text>
        </Stack>
      ))}
    </Stack>
  );
}
