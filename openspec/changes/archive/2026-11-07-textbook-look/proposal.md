# The textbook's look: two theme packs and the page built to them

## Why

The compendium's pages draw in whatever pack the Storybook toolbar has chosen, with layout that was never designed: a reading column borrowed from the first mockup, figures in plain cards, exercises in plain cards. Reference research (Refero, 2026-11-07) settled on two directions worth keeping, a dark research console and a light industrial blueprint, and mockups of one Fourier chapter in each were approved. The textbook needs those as real zen theme packs and a page layout that follows them, so every chapter reads the same way and nothing is styled by hand.

## What Changes

- Two theme packs, `textbook-console` (dark first) and `textbook-blueprint` (light first), each with both modes, their Refero style ids and the source rules they keep.
- A `reading` face in the contract (`--font-reading`) for long-form body text, defaulting to the sans in every existing pack.
- The compendium page redrawn to the lock: a chapter plate (numeral and meta) at the head, numbered section headings, body in the reading face at a generous measure and leading, figure and exercise cards on the raised layer (whose shadow the pack decides), the scrub as a highlighted pill, and the book's contents as a ruled ledger with done counts and the chapter's live quantities.
- The compendium plays run under both packs.

## Capabilities

### New Capabilities

- `textbook-theme`: the two textbook packs and the reading face, as a page consumes them.
- `textbook-page`: how a compendium page and book lay out under a pack.

### Modified Capabilities

(none)

## Impact

`src/library/contract.ts` (one optional face and its variable), `src/library/themes/` (two palettes, faces, materials, principles, packs), `.storybook/preview-head.html` (fonts), `src/library/compendium/layout/*` and `components/{Figure,Exercise,Scrub}` CSS and small prop additions, `scripts/compendium-stories.mjs` (a pack argument), `library.test.tsx` (the new packs are held to its colour rules automatically).
