# Zen

Interface design from first principles. Zen is a design OS: a token contract whose theme facets (palette, type, chrome, density) mix freely, reusable components, and the [Yahaha](https://github.com/satoramoto/yahaha) arranger app's interface redesigned on it. [docs/design-os-handoff.md](docs/design-os-handoff.md) explains the ideas and where the work stands.

## Mission

Zen makes good interfaces easy to compose, with less infrastructure to maintain.

**Swap the theme, change the character, preserve the quality.** Read the [mission and theme-quality contract](docs/mission.md) for the distinction between quality and stylistic preference.

## Development

Use Node.js 22.12+ and npm. Run `npm install`, then `npm run dev`.

The unified launcher serves a static root notice on http://127.0.0.1:4191 and Storybook on http://127.0.0.1:6022: one Storybook holding the library, harnesses and Yahaha redesigns (widgets, regions and Stage). Ctrl-C stops both. To use other ports:

```sh
PREVIEW_LABEL="Zen" PREVIEW_PORT=4191 STORYBOOK_PORT=6022 npm run dev
```

Do not start independent child servers. If a preview fails, stop its entire owned group and restart the launcher. It refuses occupied ports and never stops unrelated processes.

## Yahaha originals

`yahaha/` is a verbatim copy of the Yahaha app's Svelte UI library (`app/src/ui`) and its Storybook config, taken from yahaha `develop` at b426bcb3 (MIT). It is the reference the redesigns started from. It is its own npm package (Svelte, TypeScript 6) and isn't part of `npm run dev`; to see an original, run `npm --prefix yahaha install` and `npm --prefix yahaha run storybook`.

## Checks

`npm run typecheck`, `npm test`, `npm run build`, `npm run build:storybook`. `AGENTS.md` says when to run each.

## Field guide retirement

The original six-book interactive field guide has been retired. Its earlier reviews in `docs/` are historical records. The design system and its examples continue in Storybook.

`Development/Preview catalog` contains the retirement scenarios. The root scenario reads the running root preview at port 4191 by default (override with the `rootPreview` iframe query parameter). `node scripts/check-preview-catalog.mjs` exercises the scenarios and built root page against a managed Storybook; see [verification](docs/field-guide-retirement.md) for the catalog baseline and browser evidence.
