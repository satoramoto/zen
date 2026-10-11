/**
 * One hue per Settings section (the owner's call: "call out logical sections with colour"). A
 * section's wrapper takes `sectionHue(hue)` as its inline style: it points the neutral roles at
 * the section's hue, so the section's GroupHeader title and rule, and every neutral control inside
 * it (Button, LampButton `t`, ChosenTabs, LineSlider, Stepper, chosen blocks), draw in that hue:
 * the rest outline and label, the on and chosen fill, the absent face. Row labels and values keep
 * --value-ink and --caption-ink, which this leaves alone. Only the kit's hue tokens, no literals.
 */

/** The hues a section may take: the part and section-family hues, never `ok` (that means "running"). */
export type SectionHue = 'r1' | 'r2' | 'r3' | 'l' | 'a' | 'intro' | 'main' | 'ending'

/** The inline style that colours a section in `hue`. */
export function sectionHue(hue: SectionHue): string {
  return [
    `--neutral: var(--${hue})`,
    `--absent-neutral: var(--absent-${hue})`,
    `--absent: var(--absent-${hue})`,
    `--header-ink: var(--${hue})`,
    `--header-rule: var(--${hue})`,
  ].join('; ')
}

/**
 * Each page's sections, top to bottom and left to right: neighbours always differ. One place, so
 * the same idea keeps the same hue from page to page where it can (the left hand teal, the right
 * hand's things blue).
 */
export const SECTION_HUES = {
  chord: { fingering: 'a', leftHand: 'l', split: 'r3' },
  style: { sections: 'main', timing: 'r1', playing: 'intro', dynamics: 'r2' },
  keyboard: { transpose: 'r1', lock: 'ending' },
  pedals: { pedals: 'intro', reaches: 'a' },
  system: { audio: 'main', midi: 'r1', output: 'r3', folders: 'intro', soundFonts: 'r2', app: 'a' },
  launchkey: { pages: 'r1', bank: 'l' },
} as const satisfies Record<string, Record<string, SectionHue>>
