# Zen

Interface design from first principles. Two parts:

- **A field guide**: an interactive React/TypeScript guide to typography, grids, colour and interface styling. Six books, eighteen original illustrations, and a Storybook workshop for inspecting each principle.
- **A design OS**: a token contract whose theme facets (palette, type, chrome, density) mix freely, and the [Yahaha](https://github.com/satoramoto/yahaha) arranger app's interface redesigned on it, widget by widget and then the whole Stage screen. [docs/design-os-handoff.md](docs/design-os-handoff.md) explains the ideas and where the work stands.

## Development

Use Node.js 22.12+ and npm. Run `npm install`, then `npm run dev`.

The unified launcher starts the app on http://127.0.0.1:4191 and Storybook on http://127.0.0.1:6022: one Storybook holding the field guide, the library and the Yahaha redesigns (widgets, regions and Stage). Ctrl-C stops both. To use other ports:

```sh
PREVIEW_LABEL="Zen" PREVIEW_PORT=4191 STORYBOOK_PORT=6022 npm run dev
```

Do not start independent child servers. If a preview fails, stop its entire owned group and restart the launcher. It refuses occupied ports and never stops unrelated processes.

## Yahaha originals

`yahaha/` is a verbatim copy of the Yahaha app's Svelte UI library (`app/src/ui`) and its Storybook config, taken from yahaha `develop` at b426bcb3 (MIT). It is the reference the redesigns started from. It is its own npm package (Svelte, TypeScript 6) and isn't part of `npm run dev`; to see an original, run `npm --prefix yahaha install` and `npm --prefix yahaha run storybook`.

## Checks

`npm run typecheck`, `npm test`, `npm run build`, `npm run build:storybook`. `AGENTS.md` says when to run each.

## Reference boundary

Principles are paraphrased teaching takeaways, not quotations or exhaustive summaries. Illustrations are original applications, not reproduced book pages. References and the earlier two-agent concept reviews are in `docs/`.

## The interactive field guide

The website presents six books with three original visual studies each. Book navigation preserves experiment state. Each card puts a paraphrased principle alongside a live React illustration, a labeled control, a precise account of what changes, and its public reference. All typography and illustrations use local system fonts, CSS, and an original SVG; no remote visual assets are required.

`src/catalog.ts` contains the typed book/example registry and source boundaries. `src/PrincipleExample.tsx` renders all eighteen specimens with React state and real JSX. `src/App.tsx` composes the reading guide. The six `src/stories/*.stories.tsx` book groups each expose three standalone typed CSF stories, with meaningful Boolean, range, or select Controls. The optional Overview story presents the full guide. Changing Storybook args updates the illustration; on-canvas controls allow direct exploration without opening the Controls panel.

| Story group | Examples |
| --- | --- |
| Thinking with Type | T1 hierarchy; T2 reading measure; T3 repeated roles |
| Grid Systems | G1 shared edges; G2 content proportions; G3 regular intervals |
| Interaction of Color | C1 relative gray; C2 color in context; C3 hue comparison |
| Refactoring UI | R1 quiet competition; R2 spacing scale; R3 help-text ownership |
| On Web Typography | W1 type voice; W2 complementary roles; W3 responsive type |
| Practical Typography | B1 body leading; B2 selective emphasis; B3 punctuation |

`npm test` covers catalog/navigation, every control, the focal/color/type invariants, eighteen story exports, and external Storybook arg updates. DOM tests do not establish visual browser acceptance: responsive layout and perceptual effects still require browser inspection. Original concept-review reports in `docs/` apply to the preceding HTML artifact; they are not React runtime evidence.

Completed React/JSX verification is recorded in [verification](docs/verification.md), with separate automated-test and integrated-browser evidence, and independent source/reference approvals in [JSX review A](docs/jsx-review-a.md) and [JSX review B](docs/jsx-review-b.md).

## Task-led comparison rebuild

Every study now starts with a concrete reading task or perceptual prediction. The alternatives are professionally plausible compositions, not intentionally broken layouts. Captions identify the changing variables, invariants, and the tradeoff. C1–C3 show identical targets simultaneously in different contexts, with a neutral reveal that preserves their color, area, and position. These are contextual color demonstrations, not an explanation or reproduction of the dress photograph.

T2 offers a plausible 44–76 ch range; W3 compares fixed and adaptive policies at the same requested width (280–640 px). Panels cap width on small screens. W1 explores associations rather than ranking fonts. B1 compares readable 125% and 145% leading; B2 compares policy scanning with action-oriented emphasis. These are observational experiments, not measured usability studies.

The rebuilt test suite contains 45 checks of state transitions, story arguments, and fixed-content/color invariants. Historical verification reports describe earlier revisions; use a review report’s exact commit when evaluating which illustration it covers.

## Realistic comparison rebuild

The current18 examples use credible compositions, concrete reader tasks, and explicit tradeoffs. Color studies show identical targets in different contexts with a simultaneous neutral reveal. The updated [teaching reviews and browser verification](docs/rebuild-verification.md) supersede earlier example acceptance records.
