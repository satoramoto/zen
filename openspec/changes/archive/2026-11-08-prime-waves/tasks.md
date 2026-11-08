# Tasks

## 1. The model

- [x] 1.1 `math/primes/model/primes.ts`: a sieve to 1,300,000, `firstPrimes(n)` (n ≤ 100,000), `gaps`, `histogram`; tests check the 10,000th prime is 104,729 and the commonest gap among the first 10,000 primes is 6
- [x] 1.2 `model/waves.ts`: boundary wave, interior node marks, closest approach between primes' marks, wrapped curve; tests check no two primes' marks meet for the first 60 primes and the closest approach for 5, 7, 11, 13 is 1/143
- [x] 1.3 `model/fields.ts`: cached cosine tables, the radial profile and the box field per D1/D4, the sphere and plane meshes; tests check the profile is 1 at integer radii and −1 + 2/N at halves, and the box field's symmetries
- [x] 1.4 `model/spectrum.ts`: radix-2 FFT (tested against a direct DFT), the gap-tone signal with coherent segments, the indicator signal, peak finding; tests check spikes at g·f0 proportional to gap counts and the indicator's peaks at ½, ⅓, ⅙ with weights 1, ½, ½

## 2. The figures (each with stories and plays under `Math/Primes/<Name>`)

- [x] 2.1 `parts`: a theme-reading raster canvas (colour ramp from contract variables, repaint on theme change, a working status, role img and description); a play switches the theme and sees the canvas change
- [x] 2.2 BoundaryWaves (SVG): count, stacked/overlaid, marks with the closest approach; play: marks on for four primes, reads 1/143
- [x] 2.3 WrappedWaves: curves up to 60, density disc up to 100,000 drawn in chunks; play: count from 4 to 20,000 switches to the disc and the description says so
- [x] 2.4 RingField: count, extent, resolution; caption on rings versus sampling; plays: resolution changes the centre while the ring at radius 1 stays bright; a request over the cap is clamped and said
- [x] 2.5 GapSpectrum: count, signal (gaps/indicator), histogram beside; plays: the tallest spike is at 6 and matches the tallest bar; the indicator names ½, ⅓, ⅙
- [x] 2.6 BoxField: count, resolution; caption on symmetry and sampling; play: the field's description says symmetric, resolution change redraws
- [x] 2.7 FieldShape: plane/sphere switch, turn buttons, BoxField fallback without WebGL; play: switching shape changes the description, a turn button rotates (description's view angle changes)
- [x] 2.8 `math/primes/index.ts`, `math/index.ts` (named exports), `math/README.md`; `npm run typecheck`, `npx vitest run src/library/math/primes`, the library rules, and every figure looked at in both packs and at 390 px

## 3. The chapter

- [x] 3.1 `compendium/book/prime-waves/`: glossary, figures registry, the book; a model test validates the chapter, checks every section after the first has a bound figure with a scrub, every claim paragraph opens with a mark, speculation marks on the information section, the citation, and the three exercise kinds with hints and solutions
- [x] 3.2 The chapter text in the video's order (spec), in our own words, with the established/interpretation/speculation marks and the honest notes next to the resolution, histogram and sphere figures
- [x] 3.3 Exercises: quantity (the fewest primes whose marks come closer than 1/1000: 12, since 31·37 = 1147), choice (why 6), typed numeric (the closest approach for 5 and 7 as a decimal); Book stories "Prime waves" (to read) and a play that scrubs each section and completes one of each kind
- [x] 3.4 `scripts/compendium-stories.mjs` plays `Math/Primes` and screenshots the chapter in both packs, wide and at 390 px, with zero overflow; compendium README lists the book
- [x] 3.5 Full checks: typecheck, `npm test`, `npm run build:storybook`, every play in both packs, screenshots reviewed by eye

## Workflow follow-up

- Archive with `/opsx:archive` after the PR merges.
