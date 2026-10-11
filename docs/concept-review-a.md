# Independent review A — V1

Reviewed `brief-v1.html`, SHA256 `4a123bd47c0a17977db94d5ed9b1ad2d90634b67c8caf57bf98bfd617b0658ea` (hash independently verified). All 18 examples reviewed independently against supplied axioms, source, and primary public references. No other review read. No implementation/runtime modified. Pass below means source-level axiom adherence, not browser acceptance or verification against an entire printed book.

## Actionable finding

**P2 — T2/W3 width controls can become inert on narrow screens.** T2 has minimum 28ch (line 22; CSS line 7); W3 has minimum 260px (line 47; CSS line 11). Both are bounded by the available content width. Whenever T2's available width is less than 28ch, every value yields the same text measure; whenever W3 has less than 260px available, every value yields the same container, title size, and padding. The slider numbers still change. This contradicts meaningful visual interaction at narrow sizes, even though the cap is honestly disclosed. Please measure endpoints in the rendered 320px host. Fix with a viewport-aware effective range (and accurate displayed units), or a scrollable virtual canvas whose requested layout widths remain distinct. Retest both extremes at 320px and 736px. Parent owns runtime verification; this is a source-derived failure condition.

## Per-example assessment

| ID | Verdict | Evidence and reference level | Needed change |
|---|---|---|---|
| T1 | Pass | Line21 / CSS6: title, deck, kicker, metadata acquire distinct hierarchy; words and sequence stay fixed. Chronicle overview supports arrangement and typographic systems, not this exact example. | None; runtime confirmation pending. |
| T2 | Revise | Line22 / CSS7: only maximum measure changes; 17px Georgia, leading and alignment fixed. Topic-level publisher support. Width cap can make control inert. | Resolve narrow-screen control range as above. |
| T3 | Pass | Line23 / CSS7: equivalent entry titles share face, size, left edge when enabled; inconsistent second/third entries when disabled. Publisher overview supports alignment and systems; original extrapolation. | None. |
| G1 | Pass | Line27 / CSS8: time and description columns share reference points when enabled; offsets are removed. Niggli overview establishes grid-method relevance, not exact layout. | None. Reflow from changed horizontal space is a normal consequence; row gap is fixed. |
| G2 | Pass | Line28 / CSS8: 1:1 changes to 2:1 with same text/type/gutter. More space for prose illustrates adapting proportions; caption avoids universal ratio claim. Publisher topic-level evidence only. | None; inspect narrow layout legibility in runtime. |
| G3 | Pass | Line29 / CSS8: uneven 7/31/10 gaps become uniform16px. Niggli describes structured consistent design; exact rule is original adaptation. | None. |
| C1 | Pass | Line33 / CSS3: centers stay #929292; distinct surrounds become identical. Foundation account directly supports contextual color relativity; perceived effect properly qualified. | None. |
| C2 | Pass | Line34 / CSS9: fixed accent hue, size and placement displayed in light/dark composition; neutral text change disclosed. Foundation directly supports study in context; UI example original. | None. |
| C3 | Pass | Line35 / CSS3 + paint(): hue alone varied in authored HSL; saturation45%, lightness55%, gray center fixed. Foundation describes isolated experimental relationships. Explicit HSL/perceived-brightness caveat prevents false luminance claim. | None. |
| R1 | Pass | Line39 / CSS10: only supporting label/detail weight and contrast change; total stays32px. Official contents support de-emphasis principle, not complete chapter text. | None. |
| R2 | Pass | Line40 / CSS10: arbitrary paddings/gaps become16px/8px with fixed type/color. Official contents name spacing/sizing systems; implementation is original. | None. |
| R3 | Pass | Line41 / CSS10: equal label gaps become24px above/6px below; labels group with following field. Official contents support avoiding ambiguous spacing. | None. |
| W1 | Pass | Line45 / CSS11 + paint(): family switch preserves words, size, weight; subjective tone caveat avoids presenting taste as universal rule. Publisher overview supports voice/type selection; author excerpt supports contextual reading. | None. |
| W2 | Pass | Line46 / CSS11: navigation family switches, serif body/title retained; single-family alternative explicitly valid. Publisher contents support pairing, not a claim this pair is prescribed. | None. |
| W3 | Revise | Line47 / CSS11 + paint(): container units adapt title/padding while body16px fixed; genuine adaptation on wide host. Publisher overview and author excerpt support flexible screen typography. Control can be inert on narrow host. | Resolve narrow-screen range as above. |
| B1 | Pass | Line51 / CSS11: Georgia17px, max64ch fixed; leading105% vs135%. Full author chapter directly recommends body-text priority and120–145% leading. Caption correctly calls64ch a maximum, not measured character count. | None. |
| B2 | Pass | Line52 / CSS11: key stays bold; surrounding text becomes regular. Full author chapter directly supports sparse emphasis. | None. |
| B3 | Pass | Line53 / CSS11: curly quotes/apostrophe, em-dash break, en-dash time range; compound hyphen retained. Full author chapters directly support each use. | None. |

## Primary references inspected

- [Chronicle Books: Thinking with Type](https://www.chroniclebooks.com/products/thinking-with-type-1): publisher overview of alignment, spacing, ordering, grids, systems. No full-book reading claimed.
- [Niggli: Grid Systems](https://niggli.ch/en/products/rastersysteme-fur-die-visuelle-gestaltung): publisher method overview only.
- [Albers Foundation: Interaction of Color](https://www.albersfoundation.org/alberses/teaching/interaction-of-color): contextual perception and isolated direct-observation exercises, paragraphs around extracted lines110–118.
- [Refactoring UI](https://refactoringui.com/): official contents, especially hierarchy and spacing sections. No paid chapter access.
- [A Book Apart: On Web Typography](https://abookapart.com/products/on-web-typography.html): overview/contents; [author's How We Read excerpt](https://alistapart.com/article/how-we-read/): contextual reading and adaptation to screen conditions.
- Butterick full author chapters: [ten minutes](https://practicaltypography.com/typography-in-ten-minutes.html), [emphasis](https://practicaltypography.com/bold-or-italic.html), [quotes](https://practicaltypography.com/straight-and-curly-quotes.html), [dashes](https://practicaltypography.com/hyphens-and-dashes.html).

## Limits / status

No browser operated, screenshots inspected, or runtime checks independently run. Parent must supply all18 interaction results and320/736px responsiveness. Source contains all18 controls with distinct intended states; no unsupported full-book-fidelity claim found. Reference attribution caveat is appropriately explicit. No other actionable source-level findings. Available for immutable changed-revision follow-up.

## Final V2 follow-up

Independently verified immutable V2 hash `62981f5c1f52f5c73fccdf2b5f2eadddf5f688d1381b7460186c549ef6b7bdc6` and inspected full V1→V2 diff. Only T2 minimum16ch, W3 minimum160px, and G1's guide disclosure changed. Reviewed coordinator-supplied `browser-evidence.md`; I did not independently operate the browser. The supplied actual320px measurements establish distinct T2 endpoints166.884/262.899px and W3 endpoints160/296.007px, resolving my inert-control finding. Larger requested values remain capped, as accurately disclosed. G1 caption now more precisely describes the guide as well as alignment.

Final per-ID dispositions: **T1 pass, T2 pass, T3 pass; G1 pass, G2 pass, G3 pass; C1 pass, C2 pass, C3 pass; R1 pass, R2 pass, R3 pass; W1 pass, W2 pass, W3 pass; B1 pass, B2 pass, B3 pass.** T2/W3 were targeted re-reviewed; G1 caption was checked; the remaining15 unchanged prior source/reference passes carry forward. Coordinator evidence reports all18 visual control effects exercised at320px and approximately769px, six chapters without horizontal overflow at320px, and screenshot inspection. Exact736px was not separately documented; I do not claim that exact width was tested.

**Final verdict: no unresolved actionable findings in V2.** These remain original paraphrased applications supported at the reference levels above, not full-book page fidelity certification. Review complete; no implementation work continues.
