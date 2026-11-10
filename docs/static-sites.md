# Static documentation sites

`@satoramoto/zen/astro` owns the Astro builder; `@satoramoto/zen/site` owns its
React reading shell and search island. This generalizes human-free's build-time
theme/React pattern. Consumers provide content and configuration, not copied layouts.

Install Zen at a GitHub commit plus the optional `astro`, `@astrojs/react`, `react`
and `react-dom` peers. An `astro.config.mjs` is enough:

```js
import { defineSite } from '@satoramoto/zen/astro';
export default defineSite({
  title: 'Project notes', description: 'Architecture close to the code',
  site: 'https://owner.github.io', base: '/project/',
  theme: 'textbook-console', mode: 'dark',
  revision: process.env.GITHUB_SHA?.slice(0, 7),
  source: 'https://github.com/owner/project',
  content: [{ file: '../README.md', slug: '' }, { directory: '../docs' }],
  generated: [{ from: '../target/doc', to: 'api', title: 'Rust API', entry: 'my_crate/index.html' }],
});
```

Run consumer-owned generators first, then `astro build`. Deploy `dist/` as one
GitHub Pages artifact with `actions/upload-pages-artifact` and `actions/deploy-pages`.
Pages must use Actions builds. `.nojekyll` preserves underscore-prefixed assets.
Static URLs support direct loads; no SPA rewrite is needed. Node 24 is used in CI.

## Content contract

- Paths are relative to the Astro root. Directory entries recursively discover
  `.md` files sorted by filename; `index.md` becomes its directory route. `prefix`
  adds a route segment. File entries choose `slug` (empty for the home page).
- Provide a home page. The first heading supplies the title; file entries can
  override the navigation title with `title`.
- Markdown is trusted repository content, including raw HTML, not user input.
  Tables work; headings receive stable slug IDs for anchors.
- Relative Markdown links resolve against the source file and map to discovered
  pages. Other linked source files/images are copied to `assets/`. Root-relative
  URLs use the configured site base. Remote URLs remain remote. Raw-HTML URLs
  remain author-owned; use Markdown links/images for automatic rewriting.
- Duplicate routes, undiscovered Markdown links, traversal, overlapping mounts
  and missing generated entry files fail builds.
- Generated directories are copied unchanged and must use portable internal links.
  Zen never invokes language tools or executes document content.
- Search indexes page titles/text; mounted references retain their own search.
  Only the search island hydrates. Reading/navigation work without JavaScript.
- `astro dev` serves source assets and mounts; restart after content/discovery
  changes. Production builds always reread all source files.

## Ownership and checks

`src/site/content.mjs` owns discovery/path mapping; `astro.mjs` injects routes,
virtual build data and copied output. `Document.astro` applies `scopeView` and
server-renders the public reading view, hydrating `Search` separately.
`src/library/site/` uses Zen primitives and theme variables. Astro stays outside
the ordinary React/Svelte entries. Types ship beside the integration.

After `build:lib`, `npm run check:site` exercises path helpers, builds the fixture
at `/project/`, and checks keyboard search, internal resources, no-JS reading,
and 1440px/390px layout in Chromium. Screenshots go to `.shots/site/`.
`Site/Documentation` holds four scenario stories; run them against a built
Storybook with `node scripts/check-site.mjs --stories storybook-static`.
The bounded test runner closes its browser and ephemeral server in `finally`.

## Visual manuals

Opt a `scenario()` into a walkthrough and call `captureCheckpoint(context, id)`
inside its existing play. See story-spec's README for the declaration contract.
`npm run build:storybook` stamps source identity into the compiled artifact;
`node scripts/capture-manual.mjs` rejects stale builds and prints a completed
`bundles.json` path. Screenshots stay in ignored `.shots/` run directories.

Pass completed producer output to the site builder:

```js
manuals: [{ from: './captures/my-task', sources: independentlyComputedSources }]
```

Zen validates the manifest and image hashes, then supplies task navigation,
caption search, responsive figures and accessible numbered highlights. Reading
needs no JavaScript. Producer commands run before Astro, never inside its renderer.
Native adapters use the same bundle format and keep their UI/runtime independent.

`node scripts/check-manual.mjs --native <native-evidence-directory> --before
<earlier-web-bundle>` verifies capture failures, stale builds, publication errors,
caption regeneration and browser reading. Pass its printed evidence directory to
`node scripts/check-manual-stories.mjs --evidence <directory>` to run all 17 plays.
For the site fixture, set `MANUAL_BUNDLES` to the printed bundle-list path before
`npm run build:site-fixture`. Native evidence comes from Pichii's
`node site/check-manual.mjs` (add `--headless` on a machine with lavapipe/Xvfb).
