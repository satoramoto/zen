# Independent teaching review A

Reviewed immutable head `0b2aade103368fd4264eff36b7494ba974796f79` against coordinator base `db9bddb`. Source checkout: `work/realistic-examples`. Review is independent; reviewer B's findings were not read.

## Findings

1. **P2 — G3: the allegedly accidental subgroup has a meaningful semantic boundary.** `src/PrincipleExample.tsx:56–59`, paired with `src/catalog.ts:206–209`. The larger interval sits exactly between Email digest / Product updates and Sign-in alerts / New device approval. A competent designer could deliberately separate communication preferences from security controls here. Calling this an unintended subgroup and flattening it as the lesson risks teaching the wrong decision. Use genuinely equivalent content (four comparable project notifications), or explicitly teach two legitimate grouping goals and acknowledge the content boundary. The spacing contrast itself is visible and credible.
2. **P3 — T1: disclose the color/contrast change.** `src/catalog.ts:142` (T1 note), `src/styles.css:996–1008`. Payment-led changes brand and deadline colors as well as size/weight. This is a sensible hierarchy change, but the explanation omits one of its actual causes. Add color/contrast to the changed variables.

## Verdicts for all eighteen

| ID | Verdict | Teaching assessment |
| --- | --- | --- |
| T1 | Pass with caption correction | Studio identity versus payment obligation is a real hierarchy decision. Both invoices are credible; payment amount/deadline visibly gain priority. |
| T2 | Pass | 44–76 ch creates observable return-sweep and vertical-space differences without a cartoonishly narrow paragraph. Actual reading task and screen cap are disclosed. |
| T3 | Pass | Editorial format treatments remain plausible; recurring duration placement supports the ten-minute queue task. Both content differentiation and comparison speed are acknowledged. |
| G1 | Pass | Natural-width inline times versus reserved column visibly change shared starts. Finding/comparing rooms makes alignment relevant. |
| G2 | Pass | Equal columns preserve object presence; 1.7:1 supports explanatory copy. The image's scaling is disclosed, with no universal ratio claim. |
| G3 | Revise | Regularity is visible, but the purported accidental group is actually a plausible security-versus-updates division. See P2. |
| C1 | Pass | Identical gray targets on light/dark surrounds visibly invite a lightness judgment; neutral removal demonstrates equality. No right/wrong state. |
| C2 | Pass | Identical gold bars inside credible player themes vary apparent prominence. Reveal removes player furniture while retaining targets. This transfers the abstract effect to interface work. |
| C3 | Pass | Opposed surrounds produce an exploratory cast comparison; slider and neutral reveal support observation. Fixed HSL lightness is correctly not equated to perceptual brightness. |
| R1 | Pass | Two plausible booking confirmations illustrate de-emphasis while holding check-in content fixed. Task makes the focal priority concrete. |
| R2 | Pass | Locally tuned file rows look plausible; shared padding and inner gaps visibly regularize scanning. Text correctly says a scale does not make every distance equal. |
| R3 | Pass | Equal help-text spacing is a credible weak setting and the ownership change is perceptible. Task and lesson explain relative distance rather than prescribing a magic pixel value. |
| W1 | Pass | The museum poster remains professional across Georgia, system sans, and mono. Institutional voice is a subjective choice, explicitly not ranked. |
| W2 | Pass | A restrained serif/sans navigation change distinguishes roles within an otherwise coherent editorial page. Single-family unity remains a legitimate alternative. |
| W3 | Pass | Both policies work at generous width; at 280 px, fixed heading/padding consumes noticeably more space. Same-width switching makes the adaptation tradeoff concrete. |
| B1 | Pass | 135% and 155% leading are readable options, exposing density versus separation without a straw-man compressed paragraph. |
| B2 | Pass | Broader policy/amenity highlights are useful for one task; only the required response is highlighted for another. This teaches deliberate emphasis rather than blanket de-bolding. |
| B3 | Pass | CMS punctuation is an everyday plausible starting point. An enlarged sample makes small editorial distinctions inspectable, and the compound hyphen is retained. |

## Evidence and limits

Read project AGENTS.md, catalog, component implementation, relevant CSS, tests, and reference coverage. Rechecked [Albers Foundation teaching account](https://www.albersfoundation.org/alberses/teaching/interaction-of-color), [Refactoring UI official page](https://refactoringui.com/), [Butterick's body-text chapter](https://practicaltypography.com/typography-in-ten-minutes.html), and [Santa Maria's How We Read](https://alistapart.com/article/how-we-read/). The other reference relationships are judged within the repository's stated publisher-overview scope; no full-book page fidelity is claimed. Butterick's general body-text principles support B1's inquiry, not an attribution that he prescribes the particular 155% setting.

Used a dedicated background browser tab at `http://127.0.0.1:4192/`. Viewed rendered before/after states for all thirteen segmented comparisons, all three color reveals, the measure slider endpoints, all three type voices, hue rotation, and W3 fixed/adaptive at 280 px and fixed at 640 px. Source inspection confirms shared literal color values; screenshot observations confirm perceptible context changes. No desktop capture or global viewport change. Narrow-device checks and Storybook-specific controls are coordinator responsibilities and are not certified by this review. No tests/builds were run in the developer-owned checkout.

No other actionable findings in the reviewed scope. These judgments apply to the immutable head above; changes need targeted re-review.

## Targeted re-review — 034c42499566be4b9f52aae2967edd820b077081

Read the complete diff from `0b2aade103368fd4264eff36b7494ba974796f79` and verified the checkout head equals this revision.

- **T1: resolved / pass.** The axiom now names primary information versus supporting context. Caption discloses brand/deadline contrast alongside sizes/weights and qualifies metric-driven wrapping.
- **G3: resolved / pass.** Four named project subscriptions have identical notification descriptions and on states. The larger central interval now has no built-in content category boundary; the equal-row lesson matches the content.
- **R3: pass, improved.** Email versus mobile notifications can both plausibly own the mention/direct-message restriction. Relative spacing now provides information that the wording alone does not trivially resolve.
- **B1: pass in source.** Controls, specimen, caption, README, and assertions consistently use 125%/145%. Both values are within the 120–145% range explicitly recommended by the linked Butterick chapter, which was reread for this check.

**Final source/teaching disposition: all eighteen pass.** T2, T3, G1, G2, C1, C2, C3, R1, R2, W1, W2, W3, B2, and B3 retain the prior independent source/rendered assessment because the full diff leaves them unchanged. No actionable source or conceptual findings remain.

**Runtime limitation on the follow-up revision:** attempted to reload the dedicated preview tab for the requested visual recheck, but the browser provider was unavailable; a fresh `cua.getState()` returned no browsers. Thus I did not visually recheck the four revised specimens at this head. The earlier rendered checks remain evidence for the parent revision only. T1/G3/R3 are wording/content-only changes; B1 changes leading and still needs coordinator/final browser confirmation of its rendered density. No desktop capture, server mutation, source edit, or test execution was performed.

## Follow-up rendered evidence review

Independently inspected all eight coordinator-captured screenshots in `work/reviews/screens/`: `T1-0.png`, `T1-1.png`, `G3-0.png`, `G3-1.png`, `R3-0.png`, `R3-1.png`, `B1-0.png`, and `B1-1.png`. Coordinator identifies these as native-button captures of integrated source `034c42499566be4b9f52aae2967edd820b077081` in the isolated Storybook canvas at port 6021. This is my independent visual judgment of captured evidence, not a claim that I controlled the follow-up UI.

T1's revised axiom and disclosure match the visible invoice hierarchy change. G3 now shows genuinely equivalent project subscriptions, with credible local spacing and a subtly more regular alternative. R3's shared interval leaves the compatible hint between Email and Mobile; the ownership state visibly ties it to Email without requiring wording changes. B1's 125% rendering remains plausible and readable while 145% visibly opens its lines at the cost of height. Neither density is a deliberately broken counterexample.

**All four revised specimens pass this visual re-review. All eighteen retain a passing final teaching disposition. No actionable findings remain.** This closes the follow-up visual-evidence gap, while preserving the distinction between my original live interaction checks and the coordinator's follow-up captures. Narrow-device validation remains outside this review.
