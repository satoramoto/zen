# Independent review B

Reviewed immutable `brief-v1.html`, SHA256 `4a123bd47c0a17977db94d5ed9b1ad2d90634b67c8caf57bf98bfd617b0658ea` (verified with shasum). Read all HTML, CSS and JavaScript and independently opened all supplied primary references. No other review was read. No implementation or runtime resources changed. Browser verification remains coordinator-owned and was not supplied at this report's initial writing.

## Findings

- **P2, narrow-screen validation gap: T2 and W3 can become inert.** At `brief-v1.html:21` (T2), the minimum is 28ch; line 6 caps the actual block to its available containing width. At line 47 (W3), minimum requested width is 260px; line 10 clamps it to 100% of available width. Thus below approximately 238px of text space (T2, exact Georgia metrics platform-dependent), or 260px of card content (W3), the entire range produces the same visual result. These are plausible at the required 320px viewport after card/panel gutters. The captions disclose capping, but this still prevents experiencing the axiom on a small screen. Coordinator should measure endpoints at320; if inert, use responsive effective ranges or a scaled preview with a genuinely variable internal width. Do not call the controls verified based solely on their changing output text.
- **P3, G1 caption contradicts its controlled variables.** Line 7 adds a vertical background guide only in the aligned state, while line 26 says only horizontal alignment changes. Remove the guide, keep it in both states, or explicitly describe the guide as an additional aid. Column-width changes can also reflow content, so “row spacing stays fixed” is accurate only for CSS gap, not every row's vertical coordinate.

No other actionable source-level defect found. All 18 original demonstrations exist, and their declared teaching principles are reasonable paraphrases at the reference support levels below. This is not full-book fidelity certification.

## Per-example review

“Pass” means source/axiom/reference alignment passes, pending runtime acceptance; it does not claim I exercised the control.

| ID | Result | Principle and implementation evidence | Reference support / required action |
|---|---|---|---|
| T1 | Pass | Distinct kicker/title/deck/meta rules versus uniform15px typography; text/order remain fixed (lines5,20). Clear hierarchy study. | Publisher overview [T] supports ordering/spacing/system topics, not exact recipe. No source fix. |
| T2 | Uncertain | Only max-width custom property changes; Georgia17/1.5 and left alignment remain fixed (lines6,21,65). Faithful measure study where width can vary. | Publisher overview [T]. Resolve mobile endpoint gap above. |
| T3 | Pass | Three equivalent entries normalize title family/size and left alignment (lines6,22). Deliberate inconsistent baseline makes repetition visible. | Publisher overview [T], topic-level support for typographic systems. No source fix. |
| G1 | Revise | Shared schedule columns replace displaced column starts (lines7,26). Axiom is illustrated, but guide also changes. | Publisher overview [G]. Correct fixed-variable caption or guide as above. |
| G2 | Pass | Text/image columns switch1:1 to2:1 at fixed gutter/type/content (lines7,27). Longer text receives room; neither ratio is claimed universal. | Publisher overview [G] only; original application. Coordinator should visually assess narrow widths, since equal columns are intentionally cramped. |
| G3 | Pass | Equivalent rows change7/31/10px gaps to16px gaps; padding/colors/content remain fixed (lines7,28). | Publisher overview [G]. Source matches caption. |
| C1 | Pass | Both70px squares remain#929292, backgrounds equalize through higher-specificity rule (lines3,32). Comparison isolates surrounds. | Foundation teaching account [C] directly supports contextual perception; not the full book. Good qualified perception language. |
| C2 | Pass | Accent bar/dot area, placement and#d79b54 stay fixed; interface surface and neutral text change (lines8,33). Caption openly identifies both changes. | Foundation [C] supports contextual study; UI application is original. No false single-variable claim. |
| C3 | Pass | Hue changes through --hue; saturation45%, HSL lightness55% and center stay fixed (lines3,34,65). | Foundation [C] supports isolated exercises. Explicitly distinguishes HSL from perceived brightness, avoiding a major potential confound. |
| R1 | Pass | Supporting labels/detail weight and color reduce; total remains32px/500 (lines9,38). | Official contents [R] explicitly includes de-emphasis and weight/contrast. Not full-chapter verification. |
| R2 | Pass | Irregular row padding/gaps normalize to16/8px; type/color unchanged (lines9,39). | Official contents [R] explicitly includes spacing/sizing systems. A small genuine spacing scale. |
| R3 | Pass | Label margins change16/16 to24/6px, so each label is closer to its own illustrated field (lines9,40). | Official contents [R] includes ambiguous spacing. Illustration is honestly marked as illustrative, not an interactive form. |
| W1 | Pass | Select changes headline family only; editorial/utility/technical examples expose distinct tone (lines10,45,65). | Publisher [W] explicitly frames type as voice and discusses selection; author excerpt [WX] supports contextual reading. Subjectivity disclosed. |
| W2 | Pass | Navigation switches Georgia to system sans while body/headline stay serif (lines10,46). Family contrast marks roles. | Publisher [W] lists choosing/pairing; excerpt is not proof of a specific pairing rule. Single-family validity explicitly acknowledged. |
| W3 | Uncertain | Container width drives cqi headline size and padding, body stays16px (lines10,47,65). Faithful responsive study when effective width varies. | Publisher [W] flexible systems; author excerpt [WX] explicitly discusses screen-dependent reading. Resolve mobile endpoint gap. |
| B1 | Pass | Only leading changes1.05→1.35, Georgia17px/max64ch fixed (lines10,51). Clear body-text study. | Full public chapter [B1] directly supports prioritizing body text and120–145% leading. 64ch is a CSS measure, not a promise of exactly64 characters. |
| B2 | Pass | Surrounding spans become regular while key instruction remains700 (lines10,52). | Full public chapter [B2] directly supports sparse emphasis. No source fix. |
| B3 | Pass | Straight→curly quotes/apostrophe, double hyphen→em dash, range hyphen→en dash, compound hyphen retained (lines10,53). | Full public chapters [B3a/B3b] directly support each change. No source fix. |

## Independently inspected references

- [T: Chronicle publisher overview](https://www.chroniclebooks.com/products/thinking-with-type-1): typography, alignment, spacing, ordering, layout and systems. No full text read.
- [G: Niggli publisher overview](https://niggli.ch/en/products/rastersysteme-fur-die-visuelle-gestaltung): grid construction and applications. Broad topic support only; does not independently verify each paraphrased axiom.
- [C: Albers Foundation teaching account](https://www.albersfoundation.org/alberses/teaching/interaction-of-color): contextual perception, direct observation, exercises isolating aspects of interaction. Strong support for approach, not a full-book read.
- [R: Official Refactoring UI contents](https://refactoringui.com/): hierarchy, de-emphasis, spacing systems, ambiguous spacing. TOC support only.
- [W: A Book Apart overview/contents](https://abookapart.com/products/on-web-typography.html): voice, choosing/pairing, flexible systems and composition.
- [WX: Author's Chapter1 excerpt](https://alistapart.com/article/how-we-read/): context, reading, screen variability. Not the later choosing/pairing chapters.
- [B1: Typography in ten minutes](https://practicaltypography.com/typography-in-ten-minutes.html).
- [B2: Bold or italic](https://practicaltypography.com/bold-or-italic.html).
- [B3a: Straight and curly quotes](https://practicaltypography.com/straight-and-curly-quotes.html).
- [B3b: Hyphens and dashes](https://practicaltypography.com/hyphens-and-dashes.html).

Initial outcome:15 pass,1 revise,2 uncertain. Needs targeted revision/evidence before final acceptance. Available for changed-revision follow-up; no implementation continues here.

## Final V2 targeted re-review

Independently verified V2 SHA256 `62981f5c1f52f5c73fccdf2b5f2eadddf5f688d1381b7460186c549ef6b7bdc6` and inspected the complete V1→V2 diff. It changes only T2's minimum to16ch, W3's minimum to160px, and G1's caption to explicitly acknowledge the added wide-screen guide.

Read coordinator-supplied `browser-evidence.md`: at320px T2's endpoints render166.884/262.899px and W3's render160/296.007px, resolving the potential inert-control failure. The coordinator reports all18 controls exercised, all6 chapters without horizontal overflow at320px, screenshots inspected, and wider-screen effects confirmed. This is supplied runtime evidence, not my own independent browser run. My independent contribution remains source/reference review and verification of the exact revision/diff.

Final dispositions (V2): **T1 pass; T2 pass; T3 pass; G1 pass; G2 pass; G3 pass; C1 pass; C2 pass; C3 pass; R1 pass; R2 pass; R3 pass; W1 pass; W2 pass; W3 pass; B1 pass; B2 pass; B3 pass.** The15 unchanged source/reference passes carry forward because the verified diff contains no other changes. G1's stated fixed row spacing refers to the unchanged14px CSS gap; line wrapping can naturally alter row height.

**No unresolved actionable findings.** References retain the honest scope stated above: broad publisher/TOC support for several books, stronger Foundation teaching context and public author chapters where available, not full-book certification. Review complete; available for follow-up if the implementation changes again.
