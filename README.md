# Awesome Design

An interactive React/TypeScript field guide to typography, grids, color, and interface styling. Six books, eighteen original illustrations, and a Storybook workshop for inspecting each principle.

## Development

Use Node.js 22.12+ and npm. Run `npm install`, then `npm run dev`.

The unified launcher starts the app on http://127.0.0.1:4191 and Storybook on http://127.0.0.1:6021. Ctrl-C stops both. To use other ports:

```sh
PREVIEW_LABEL="Awesome Design" PREVIEW_PORT=4191 STORYBOOK_PORT=6021 npm run dev
```

Do not start independent child servers. If a preview fails, stop its entire owned group and restart the launcher. It refuses occupied ports and never stops unrelated processes.

## Checks

`npm run typecheck`, `npm test`, `npm run build`, `npm run build:storybook`.

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
| Refactoring UI | R1 quiet competition; R2 spacing scale; R3 label proximity |
| On Web Typography | W1 type voice; W2 complementary roles; W3 responsive type |
| Practical Typography | B1 body leading; B2 selective emphasis; B3 punctuation |

`npm test` covers catalog/navigation, every control, the focal/color/type invariants, eighteen story exports, and external Storybook arg updates. DOM tests do not establish visual browser acceptance: responsive layout and perceptual effects still require browser inspection. Original concept-review reports in `docs/` apply to the preceding HTML artifact; they are not React runtime evidence.

Completed React/JSX verification is recorded in [verification](docs/verification.md), with separate automated-test and integrated-browser evidence, and independent source/reference approvals in [JSX review A](docs/jsx-review-a.md) and [JSX review B](docs/jsx-review-b.md).
