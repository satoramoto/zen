# Proposal

## Why

A short video ("FINALLY! The hidden patterns in PRIME NUMBERS show themselves", channel WTF.IsThisActuallyHappening?, youtube Y9f-Gq42Pxg) shows primes drawn as waves: rings from tens of thousands of prime waves, waves stacked in a boundary and wrapped into a circle, a spectrum of prime gaps full of spikes, a 2D field, and that field as a surface and on a sphere. The pictures are striking and easy to build in zen, but the video never says how they are made (its scripts' site now serves an unrelated page), and it mixes real arithmetic with speculation and at least one drawing artefact. Building the visuals ourselves, live and adjustable, lets a reader see the patterns and find out which ones come from the primes, which from simple fractions, and which from the screen.

## What Changes

- **A `primes` family of figures** in the math area, `src/library/math/primes/`, on the trig and Fourier figures' contract (every quantity a controlled prop with `on<Prop>`; plain SVG or a theme-coloured canvas; MeshView for 3D):
  - **BoundaryWaves**: each prime p as a standing wave with p half-waves between two walls, stacked or overlaid; optional marks at each wave's nodes, with the closest approach between any two primes' marks shown.
  - **WrappedWaves**: the same waves wrapped round a circle, as curves for a few primes and as a density disc for thousands.
  - **RingField**: thousands of prime waves summed by radius and painted as a disc of rings, with a resolution control and a per-pixel averaging switch that show how much of the picture is the pixel's; it says plainly that the video's cross and moiré are not made by this construction.
  - **GapSpectrum**: prime gaps played as tones and run through a Fourier transform, the spikes shown beside the plain histogram of gap sizes they match; a second signal, the prime indicator, whose spectrum peaks at simple fractions.
  - **BoxField**: the 1D waves extended to standing waves in a square, painted as a 2D field, with the same resolution control.
  - **FieldShape**: the BoxField's values as a 3D height surface, and the same values wrapped onto a sphere, so the flat and spherical views can be compared value for value.
- **A pure model** (`math/primes/model/`): a sieve, gaps, the boundary waves and their node marks, the radial and box fields, a real FFT, the gap-tone signal, the indicator signal, and the sphere mapping; unit-tested.
- **A one-chapter book**, `src/library/compendium/book/prime-waves/`: the video's story in our own words, each picture driven by a quantity the text scrubs, every claim marked by its standing (the arithmetic established, the video's framing interpretation, its "infinite information" and simulation remarks speculation), and checked exercises. It credits the video and reproduces none of its text.
- The play runner covers `Math/Primes` and screenshots the chapter in both textbook packs, wide and at phone width.

Nothing existing changes behaviour.

## Capabilities

### New Capabilities
- `math-primes`: the prime-wave figures: what each draws, its quantities, how a reader adjusts it, and what each says about its own pattern.
- `prime-waves-chapter`: the chapter that tells the story with those figures: its sections, what the reader moves, how claims are marked, what it checks, and the plays that hold it.

### Modified Capabilities
- (none)

## Validation

- **Inner loop** (after every edit): `npm run typecheck`; `npx vitest run src/library/math/primes src/library/compendium`.
- **Outer loop** (before merging): `npm test`; `npm run build:storybook`, then `node scripts/compendium-stories.mjs <url> .shots/prime-waves` in both textbook packs (every Math/Primes and Compendium play passes, zero overflow on the chapter at 390 px); `npm run build:lib && npm run check:lib` (the math index's exports change); `openspec validate prime-waves --strict`; the PR's `checks` job.
- **Review**: `look`. Merges when the outer loop passes; afterwards the person looks at the rings figure (our construction differs from the video's look, see design) and the chapter's tone about the video's claims.

## Impact

- New: `src/library/math/primes/` (model, figures, stories, CSS), `src/library/compendium/book/prime-waves/`, a model test for the chapter, a Book story.
- Changed: `src/library/math/index.ts` and `math/README.md` (list the family), `scripts/compendium-stories.mjs` (Math/Primes, the chapter's screenshots), the compendium README's book list.
- Uses existing parts: `math/lab/MeshView` (three.js, lazy) for 3D, the compendium's figure frame, scrubs, marks and exercises. No new dependency; no shared file (contract, themes, `.storybook/`) changes.
- Cost: summing up to 100,000 prime waves happens in the browser; the model keeps each redraw within a budget (see design).
