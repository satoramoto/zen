# Tasks

Branch `change/push-3-fidelity`. The stories own the specs: each scenario below is added as a
`scenario()` story in its capability's existing stories file, with its play beside it, by hand
(design D6). "Its scenarios play" means those stories pass in both renderers
(`node scripts/push-stories.mjs <prefix> --renderer both`). Each group ends with
`npm run typecheck` and `npx vitest run src/library/push`.

## 1. Ground

- [ ] 1.1 `scripts/push-stories.ts` defaults to `openspec/specs` and refuses to overwrite an existing stories file without `--force`; running it with no arguments writes nothing and says why
- [ ] 1.2 Fetch the manual's figures for chapters 4, 5, 8 to 11 and 2.2 into the session's scratch folder (never the repo) and list in `docs/push.md`, under Evidence, which of the nine renders has a figure and which has none

## 2. The code image

- [ ] 2.1 Add `components/CodeImage/` (model with the encoder, the two `<Tree/>` renderers, stylesheet, fixtures, stories titled `Core/Components/CodeImage`) and register it by name, in its own commit; the tree snapshot, structure, tiers and bindings-only tests pass with their baselines unchanged
- [ ] 2.2 Unit-test the encoder by decoding (`jsqr` as a dev dependency): a short, a 200-byte and a non-ASCII address read back exactly, and a 300-byte one returns nothing
- [ ] 2.3 Export `CodeImage` from `components/index.ts`, the package root and `svelte.ts` in their own commit; `npm run build:lib` then `npm run check:lib` pass
- [ ] 2.4 The display's dialog and a lesson's page draw an address as a code image with the text beside it, and as text alone when it is too long; the three `push-display` scenarios and the two new `push-setup` Learn scenarios play
- [ ] 2.5 Decode the code from a screenshot of the Learn story in `push-3` dark and in one light pack; save both renders to `docs/push/` and remove the gap from `docs/push.md`

## 3. Map on a held switch

- [ ] 3.1 In the model, holding a non-Rack device's upper display button past the hold time offers Map, and Map enters Macro Map mode with the device's on and off as the parameter; a short press and a Rack's held button behave as before; unit tests for the three cases
- [ ] 3.2 The stand-in host answers the mapping; the three new `push-device-view` scenarios play, and the hold-and-press table in `docs/push.md` is generated again with the new row

## 4. Simpler's order

- [ ] 4.1 Lay the manual's Classic, One-Shot and Slicing figures beside design D4's table; where a figure disagrees, correct the table and the `push-sampling` delta's scenarios first and say so in the doc's decisions table
- [ ] 4.2 `simplerBanks` gives the agreed order, with Trigger and Gate as options on the display buttons in One-Shot and Slicing; the existing Simpler unit tests are updated and pass
- [ ] 4.3 The three new `push-sampling` scenarios play, the changed Gate scenario plays, and every existing `push-sampling` and `push-device-view` play still passes; `display-simpler.png` and `display-simpler-slicing.png` are rendered again and the two Simpler gaps leave `docs/push.md`

## 5. Choices and pictures

- [ ] 5.1 A touched choice parameter draws the current choice large with the others dim beneath, as `Text` in the display's cell (design D2); the three `push-display` scenarios play and the Legible In Every Pack play still passes for the dim choices
- [ ] 5.2 A setting's value can name a picture (`finger`, `pad`, `input`, `output`), drawn with `Icon` under the value; the `push-display` scenario and the two new `push-setup` scenarios play; `setup-expression.png` and `setup-midi.png` are rendered again and read beside their figures
- [ ] 5.3 The two gaps leave `docs/push.md`, and its decisions table says how a choice list is drawn

## 6. The theme scenario

- [ ] 6.1 Replace the pack-list check with two plays in the UI itself: the theme picker lists push-3, and the theme inspector with push-3 chosen shows its source and rules; both `push-theme` scenarios play in both renderers

## 7. The remaining figures

- [ ] 7.1 Setup: Pedals & CV and Preferences beside their figures; change the tabs' tables until each setting is in the figure's column; renders saved, existing `push-setup` plays pass
- [ ] 7.2 Pads: 64 Notes and 64 Pads beside their figures; lamp colours and layout agree or the difference is recorded; renders saved
- [ ] 7.3 Display: the unfolded Rack, Mix, Clip (MIDI and audio), Session and the browser beside their figures; each changed until it agrees in what is in which column, or recorded as a gap with what differs; renders saved, every play in the changed capability passes
- [ ] 7.4 `docs/push.md` Evidence names all nine as compared, or as having no figure, and no longer says any render was made from the text alone unless that is true of it

## 8. Merge

- [ ] 8.1 `node scripts/push-stories.mjs --renderer both` passes whole; `npx story-spec sync --change push-3-fidelity --dir src/library/push --check` reports nothing; `openspec validate push-3-fidelity --strict` passes
- [ ] 8.2 `npm run typecheck`, `npm test`, `npm run build:storybook`, `npm run build:lib` and `npm run check:lib` pass; CI's `checks` passes on the pull request; merged by a pull request set to merge itself, branch deleted

## Workflow follow-up

- Archive with `/opsx:archive push-3-fidelity`.
- Tell the person what to look at (Review `look`): the code image on a lesson, Simpler's first bank in each mode, a touched choice, and the Evidence section's nine comparisons.
