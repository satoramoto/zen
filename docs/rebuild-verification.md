# Realistic comparisons rebuild — 11 October 2026

## Outcome
All 18 stable examples were rebuilt around plausible decisions, explicit reading tasks, and honest tradeoffs. Three color studies present identical targets in simultaneous different surroundings and remove those surroundings together. Color comparisons and typeface voice have no prescribed winner.

Implementation: source `0b2aade103368fd4264eff36b7494ba974796f79`, corrected by `034c42499566be4b9f52aae2967edd820b077081`; integrated revision `eaf177d8c65754d83537edff58976aae63a7ec3a`. See integration ledger for merge mappings.

## Independent teaching review
[Reviewer A](rebuild-review-a.md) and [Reviewer B](rebuild-review-b.md) each assessed all18 against source references, realistic alternatives, perceptible task-linked differences, truthful changed variables, and transfer to actual design. Each exercised the initial rebuilt desktop specimens. Their findings prompted corrections to G3's misleading semantic grouping, T1's variable disclosure, and B1's cited line-spacing range. Coordinator additionally strengthened R3's wording so proximity actually determines ownership. Both reviewers independently inspected eight final rendered screenshots covering both states of all four changed examples. They distinguish that screenshot evidence from their initial direct browser interaction. Final verdict: all18 pass, no unresolved actionable findings.

## Automated checks
On the integrated corrected revision: typecheck, 45 Vitest tests, Vite production build, Storybook production build, and diff check passed. Tests cover state changes, color invariants, external story arguments, navigation, and story exports. Existing nonfatal build warnings remain. These tests do not establish perceptual success or comprehensive accessibility conformance.

## Coordinator browser evidence
- All18 revised individual Storybook stories rendered successfully.
- Actual comparison buttons exercised at phone and tablet sizes; source changes exercised again after integration.
- Storybook manager applied control neutralized both C1 surrounds; manager measure control changed T2 maximum and actual width (44ch: approximately432px,76ch capped by panel: approximately564px).
- W3 keyboard width endpoints changed actual shell280→approximately587px and adaptive headline26→36px; W1 voice selection changed actual font to monospace. C3 keyboard hue changed rendered surround RGB199/117/117→199/166/117.
- All C1/C2/C3 reveals checked through actual controls: target RGB values stayed146/146/146,215/155/84,152/146/166 respectively; paired target sizes and local positions stayed constant within subpixel rounding; both surrounds becameRGB229/229/229.
- Six chapters checked in320px and736px outer iframe widths (303px/719px content due scrollbars): no horizontal document overflow. Final corrected comparison states rechecked at303px content width. Color music-player comparison visually inspected at narrow width.
- Both states of T1,G3,R3,B1 captured from integrated Storybook canvas and independently inspected by the reviewers. Their revised tasks and explanations match the visible changes.
- Preview screenshot: conversation outputs/rebuilt-color-study.png. Temporary responsive test wrapper and its tab removed.

No user study, full-book page-by-page verification, or comprehensive accessibility audit is claimed. Reference coverage remains as stated in sources documentation.

## Preview and checkout ownership
The saved ~/Code/satoramoto/awesome-design checkout changed externally to main/scaffold during work and was preserved. The persistent coordinator is now /Users/ryan/Documents/Codex/2026-10-10/what-x20-2/work/awesome-design-coordinator on codex/interactive-brief. Both worktrees belong to the same requested Git repository. The unified launcher there owns app4191 and Storybook6021; restart both with npm run dev from that coordinator. No main landing or remote publication performed.
