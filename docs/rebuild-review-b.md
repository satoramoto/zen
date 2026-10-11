# Independent teaching review B

Reviewed immutable head `0b2aade103368fd4264eff36b7494ba974796f79` against base `db9bddb` on 2026-10-11. Source is read-only; no implementation changes. Reviewer B did not consult reviewer A.

## Findings

- **P2 — G3: the alleged unintended subgroup has a real semantic purpose.** `src/PrincipleExample.tsx:55–59` places Email digest / Product updates before Sign-in alerts / New device approval. The 26 px gap falls exactly between general updates and security settings. `src/catalog.ts:206–209` calls these equivalent rows and the grouping unintended. A reader can reasonably prefer the grouping, so the claimed lesson is contradicted by its content. Use genuinely equivalent options, or frame this as deliberate semantic grouping versus flat rhythm. Desktop screenshots and switching both compositions confirmed this.
- **P2 — B1: make the departure from the named source explicit.** `src/catalog.ts:340–347` presents 135% and 155% as plausible choices with Butterick's ten-minutes page as its direct source; that page explicitly recommends 120–145%. The visual experiment itself is credible, but the default 155% is not an illustration of that quantitative recommendation. Use two plausible values within that range or explicitly identify 155% as an original web experiment outside Butterick's range. [Primary chapter](https://practicaltypography.com/typography-in-ten-minutes.html).
- **P3 — T1: disclose contrast changes.** `src/catalog.ts:145` describes changed sizes and weights only, while `src/styles.css:996–1007` also changes brand and deadline colors. Add contrast/color to the changed-variable note; the perceptible emphasis is partly due to that change. This does not invalidate the otherwise successful hierarchy lesson.

## All eighteen verdicts

| ID | Principle/reference | Teaching verdict and reason |
|---|---|---|
| T1 | Hierarchy / Lupton publisher topic coverage | Pass with caption correction. Both invoices credible; payment emphasis changes obligation scanning without hiding brand. |
| T2 | Measure / Lupton topic coverage | Pass. 44–76 ch visibly changes line breaks and return-sweep distance; tradeoff is explained without a universal winner. |
| T3 | Repetition / Lupton topic coverage | Pass. Mixed editorial formats remain plausible, while right-positioned durations support the ten-minute task. Thumbnail/format distinctions survive. |
| G1 | Alignment / Niggli grid-method overview | Pass. Natural-width times are believable; common title/room edge is visibly easier to compare. |
| G2 | Proportions / Niggli overview | Pass. Both exhibition layouts look credible; text wrapping and object presence change in an intelligible tradeoff. |
| G3 | Rhythm / Niggli overview | Revise. The split is semantically meaningful, contrary to caption; see P2. |
| C1 | Relativity / Albers teaching account | Pass. Identical simultaneous gray squares under contrasting surrounds; neutral reveal makes equality visible. |
| C2 | Context / Albers account | Pass. Identical gold bars in credible simultaneous light/dark players; surroundings disappear while targets stay. No theme winner. |
| C3 | Relational exploration / Albers account | Pass. Muted violet targets fixed, complementary surround hue changes apparent cast; reveal works and HSL caveat is honest. |
| R1 | De-emphasis / Refactoring UI official tactic | Pass. Already plausible booking hierarchy becomes quieter without enlarging focal block. Effect is modest but visible and task-specific. |
| R2 | Spacing system / Refactoring UI official contents | Pass. Locally adjusted rows are plausible; shared scale visibly stabilizes icon/title edge and vertical rhythm. Avoids claiming tokens dictate every spacing. |
| R3 | Proximity / Refactoring UI spacing topic | Pass. Equal-gap helpers look plausible but weakly attached; changed relative distance visibly clarifies ownership. |
| W1 | Voice / book topic framing | Pass. Three restrained poster voices are credible; contextual associations are explicitly subjective. |
| W2 | Pairing / book topic framing | Pass. Nav-family contrast changes role separation subtly; one-family alternative remains valid. No unsupported speed claim. |
| W3 | Adaptation / author's reading-context excerpt | Pass. Fixed 36 px/28 px layout is competent at roomier size; at 280 px adaptive heading/padding frees visible reading space while preserving body size. |
| B1 | Body conditions / Butterick direct chapter | Revise source framing. Both render plausibly, but 155% exceeds the named recommendation without disclosure. |
| B2 | Selective emphasis / Butterick bold-or-italic | Pass. Broad emphasis marks genuinely useful travel facts; task shift explains why action-only emphasis can be better. |
| B3 | Punctuation / Butterick direct chapters | Pass. Ordinary CMS punctuation is realistic; editorial alternative and enlarged marks teach distinct uses while preserving compound hyphen. |

## Evidence and limits

Read project AGENTS, catalog, component, relevant CSS, changed stories, and tests. Independently exercised all 18 examples in background browser tab at `http://127.0.0.1:4192/`, visually comparing all composition toggles, all three voices, T2 range endpoints, W3 280/640 px specimens, and all three color reveals plus hue change. Desktop screenshots were inspected. No browser-global viewport changes, no desktop capture, no shared server management. No claim of narrow-window acceptance or Storybook manager validation; coordinator owns those checks. No tests/builds run in developer-owned checkout.

Opened primary reference pages for Lupton/Niggli publisher descriptions, Albers teaching account, Refactoring UI contents, Santa Maria excerpt, and Butterick chapters. Publisher/overview material supports topic alignment rather than exact full-book fidelity. No full-book page verification is claimed. This is expert review, not a user study proving reading-speed gains.

Overall: substantial improvement over straw-man negatives. Sixteen examples are conceptually acceptable; G3 and B1 need the targeted changes above. Awaiting a new immutable revision for re-review. Later revisions are not covered by this report.

## Targeted re-review — 034c42499566be4b9f52aae2967edd820b077081

Reviewed the complete diff from `0b2aade` to `034c424` (four files: component, catalog, tests, and README; README updates the leading values), verified exact checkout HEAD and clean status. No source changes made.

All reported findings are resolved in source:

- T1 now describes primary/supporting hierarchy and explicitly discloses brand/deadline contrast changes and possible wrapping. Pass.
- G3 now compares notification subscriptions for four named projects, all with the same “New comments and mentions” description. There is no longer a meaningful security subgroup at the larger interval. Pass.
- B1 uses 125% and 145% leading consistently in rendering, labels, notes, and tests. Both sit inside the cited source's range. Pass.
- R3 now asks whether Email or Mobile notifications are limited to mentions/direct messages. Both labels could plausibly own the help text, so proximity has real work to do; the task is no longer answerable from security-versus-weekly semantics alone. Pass.

Final source/teaching disposition: T1, T2, T3, G1, G2, G3, C1, C2, C3, R1, R2, R3, W1, W2, W3, B1, B2, B3 all pass the conceptual review, with unchanged verdicts carried forward from the independently exercised prior head. No actionable source findings remain.

**Runtime evidence boundary:** attempted to reload the owned background tab and then create a fresh background IAB tab for the revised specimens. Both failed because the browser was unavailable. Therefore this addendum does not claim a new visual comparison of the changed G3/R3 text or B1 125/145 leading at this head. Previous desktop screenshots/interactions cover the original revision, not this changed revision. Coordinator must complete the targeted visual check. No builds or tests were run by this reviewer.

## Independent visual follow-up using coordinator-captured evidence

For source `034c42499566be4b9f52aae2967edd820b077081`, independently inspected all eight images at `work/reviews/screens/{T1,G3,R3,B1}-{0,1}.png` with the image viewer. Coordinator reports these were captured from the integrated unchanged source in isolated Storybook canvas on port 6021, using actual comparison buttons. Capture and interaction provenance belongs to the coordinator; visual judgments below are reviewer B's independent inspection, not a claim that reviewer B personally operated this revision's controls.

- **T1 pass:** both invoices remain competent; obligation prominence changes visibly, and the corrected caption accounts for size/weight/contrast.
- **G3 pass:** all four project rows now share an identical notification role. The small extra middle interval no longer has a semantic security-group rationale. Rhythm contrast is subtle but visible, credible, and accurately explained.
- **R3 pass:** the helper could plausibly describe either channel in the evenly spaced composition. The closer helper and larger following gap visibly establish Email ownership without adding decoration. Both screens remain plausible.
- **B1 pass:** both 125% and 145% treatments remain readable, with visible density/height difference; neither is caricatured. Values now match the cited recommendation range.

Final disposition: all eighteen examples pass this teaching-quality review at source `034c424`, with unchanged examples carried forward from the original independent desktop interaction review and changed examples validated through source plus independent inspection of coordinator-captured images. No actionable findings remain. Narrow-window checks and general Storybook interaction acceptance remain outside this review. Review complete; no continuing work.
