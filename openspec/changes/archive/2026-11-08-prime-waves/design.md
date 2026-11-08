# Design

## Context

See proposal.md for why. What shapes the approach:

- The video's own scripts are unreachable (its site now serves an unrelated page), so each figure is reconstructed from the frames and the narration. Where the video is ambiguous, the design picks the simplest construction that draws the same picture, says so in the figure's source line, and keeps it honest (D1).
- The trig and Fourier families set the figure contract: quantities as controlled props via `math/fourier/useControlled`, plain SVG for line drawings, a pure tested `model/`, stories with plays. `math/cymatics/CymaticField` shows how a canvas reads its colours from contract variables and repaints on a theme change; `math/lab/MeshView` is a lazy three.js viewport that takes a `TriangleMesh` with per-vertex colours.
- No FFT exists in the repo and `lab/foundations.primesThrough` is trial division, too slow past a few thousand; the model brings a sieve and an FFT.
- The compendium has everything the chapter needs (scrubs, bound figures, standing marks including speculation, the three exercise kinds, citations); no primitive change.

## Goals / Non-Goals

**Goals:**
- Every picture in the video, reproduced closely enough that a viewer recognises it, and driven by the reader.
- Each figure tells the reader where its pattern comes from, with a control that proves it where one exists (resolution, signal choice, shape switch).
- Responsive at the counts the video uses (20,000 to 100,000 primes) without a worker.

**Non-Goals:**
- Reproducing the video's exact images, colours (viridis) or its 1,000,000-wave frames: the figures use the pack's colours and cap counts (D4).
- The video's Prime Number Theorem, zeta-spiral and Ulam-style openers: context, not its argument.
- Endorsing or refuting "prime scalar field" claims beyond what the figures show; the chapter marks them by standing.
- Audio playback of the gap tones (the spectrum is computed from the signal; sound is a possible later addition).

## Decisions

**D1. The constructions.** Chosen to draw what the frames show with the least machinery:
- *A prime as a wave in a boundary*: `sin(p·π·x)` on x ∈ [0, 1], p half-waves between walls; the video's stacked rows are these with a vertical offset. *Marks*: the interior nodes k/p. Distinct primes' marks never coincide because k/p = j/q would need p to divide k; the closest approach is `min |kq − jp| / pq`, at least 1/(pq).
- *Wrapped*: radius `1 + a·sin(p·θ)` for θ ∈ [0, 2π]; at high counts the curves are accumulated into a density raster (each curve sampled at 720 angles, alpha-blended), which is what the grey disc in the video looks like.
- *Rings*: the radial profile `F(r) = (1/N) Σ cos(2π·p·r)`, computed once per redraw on R radial bins (R = the resolution), then painted by radius. Rings at integers (all terms 1) and dark halves (all odd terms −1) are the arithmetic. Built and looked at, this construction draws thin rings on flat grey (a pixel at its own radius) or many rings at simple fractions (a pixel averaged over its width: each wave weighted by sinc(p·width)); it does not draw the video's broad rings, cross or moiré, and the figure says so. Matching the video's look would need a construction the video does not give.
- *Gap spectrum*: each gap g becomes a segment of `S` samples of `sin(2π·g·f0·t)`, with S a whole number of base periods so segments add coherently; the magnitude spectrum's value at g·f0 is then proportional to the count of gap g, which the histogram shows. The *indicator* signal is 1 at primes, 0 elsewhere, up to M; its spectrum peaks at a/q with weight |μ(q)|/φ(q) (½, then ⅓ and ⅙, then ⅕).
- *Box field*: `G(x, y) = (1/N) Σ cos(2π·p·x)·cos(2π·p·y)` on an R × R grid, computed as CᵀC from the N × R table of cosines.
- *Shape*: the box field's grid as a height surface (z = G, colour from G), and as a sphere with x → longitude, y → latitude, radius 1 + ε·G, colour from G.
*Alternatives*: plane waves in prime-indexed directions, or point sources at prime positions, would also make interference pictures, but neither matches the frames' symmetry and both need a free parameter the video never names.

**D2. One model, separate drawings.** `model/primes.ts` (sieve to 1,300,000, which holds 100,000 primes; `firstPrimes(n)`, `gaps`), `model/waves.ts` (boundary wave, node marks, closest approach, wrapped curve), `model/fields.ts` (radial profile, box field, sphere mapping), `model/spectrum.ts` (radix-2 FFT on a power-of-two length, the gap-tone signal, the indicator signal, peak finding, histogram). Figures only draw. *Why*: the maths is testable without a DOM, and the chapter's numbers come from the same functions.

**D3. Rasters on a canvas, colours from the contract.** RingField, BoxField and WrappedWaves at high counts paint a `<canvas>` with an `ImageData` ramp between two contract colours (`--surface-1` to `--text-1` for greyscale, `--hue-1`/`--hue-3` for signed fields), read the way CymaticField does and repainted on theme change. The canvas has `role="img"` and a description. *Why*: SVG cannot hold 100,000 curves or a 512² field.

**D4. Budgets and caps.** RingField: N ≤ 100,000, R ≤ 768 (≤ 7.7·10⁷ cosines, done incrementally: the cosine table is cached per N and the profile per (N, R, extent)). BoxField: N ≤ 2,000, R ≤ 384. WrappedWaves density: N ≤ 100,000 at 720 samples each, drawn in chunks over animation frames with a "Drawing n of N" status. GapSpectrum: N ≤ 100,000 gaps with S chosen so the signal fits 2²⁰ samples; indicator M ≤ 2²⁰. A larger request is clamped and the caption says the limit. *Why*: no worker, no new build config; the caps cover the video's counts except its 1,000,000 frame.

**D5. FieldShape reuses MeshView.** The mesh comes from the model (a (R+1)² grid of positions and colours for the plane; a latitude-longitude sphere for the sphere); MeshView already rotates by pointer and handles loss of WebGL with a fallback message. Keyboard rotation is added by FieldShape as buttons ("Turn left/right/up/down") that rotate the mesh data, since MeshView's orbit controls are pointer-only. When 3D is unavailable the figure shows BoxField instead. *Alternative*: a new three.js viewport; rejected, MeshView already does this.

**D6. Saying what a pattern is, in the figure.** Each figure's caption states the origin of its main features in one sentence, and the controls that test it are next to it: RingField and BoxField "Resolution"; GapSpectrum "Show the histogram" and "Signal"; FieldShape "Plane / Sphere". The chapter does the longer telling.

**D7. The chapter is a one-chapter book under `compendium/book/prime-waves/`.** Per the course rule: `chapter.ts`, `glossary.ts`, `figures.tsx`, `prime-waves.book.ts`, and a model test. Quantities: `count` (per section, as the figure allows), `resolution`, `extent`. Standing marks per the spec. *Why*: the story needs scrubs and marks, and a book gives it the ledger and plate for free.

## Risks / Trade-offs

- [The reconstruction differs from the video's actual code] → Each figure's source line states its formula, and the chapter says the constructions are ours; the pictures match the frames closely enough to recognise.
- [100,000-wave redraws are slow on a phone] → Incremental caches (D4), a working status, lower default counts on narrow containers (20,000), and plays assert the result rather than timing.
- [Canvas colours ignoring the theme] → Read through computed styles as CymaticField does; a play switches theme and checks a pixel changed.
- [Calling the video wrong] → The text is careful to mark standing rather than mock; the figures show, the chapter states plainly where a pattern comes from, and the video's own framing is kept as interpretation.
- [MeshView's pointer-only rotation fails the keyboard rule] → FieldShape's turn buttons (D5).

## Open Questions

- Whether to add audio for the gap tones later; nothing above depends on it.
