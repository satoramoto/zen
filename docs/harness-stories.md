# Playing stories: `zen-stories`

`zen-stories` plays a project's Storybook stories from the command line with as little machine
as each story needs. Most stories play on a virtual DOM (jsdom) with no browser at all. A
story that needs a real browser says so with a tag, and only those open Playwright's Chromium
headless shell.

It is zen's, in `src/harness/stories/`, and any project with a React-on-Vite Storybook can use
it. It replaces each project's own Playwright script for playing stories.

## Using it in a project

```sh
npm install --save-dev vitest jsdom playwright
npx playwright install --only-shell chromium
```

```json
"scripts": { "test:stories": "zen-stories" }
```

The project's own `.storybook/main` and `.storybook/preview` are used as Storybook uses them:
its stories globs, its Vite config with `viteFinal`, its decorators, loaders and globals.

In zen itself the script is `node src/harness/stories/cli.mjs`: a package's own bin is not
linked into its own `node_modules/.bin`.

## Three runs

| Run | Where | What it plays |
| --- | --- | --- |
| `zen-stories` | on your machine | every story on the virtual DOM, and the `browser` stories in the headless shell against the served Storybook |
| `zen-stories --no-browser` | on a pull request | every story on the virtual DOM; `browser` stories are skipped and counted |
| `zen-stories --browser-all` | on `main` | every story in the headless shell, against the served Storybook, or a built one (`storybook-static`, or `--static <dir>`) when none is served |

The run on `main` is the check that a story which passes on the virtual DOM also passes in a
real browser: hidden by CSS, off-screen, overlapped, or laid out wrong. Play it against the dev
server: plays are written against it, and a built Storybook runs React's production code, where
`act` does not exist and errors are minified. On zen's build, 183 stories that pass on the dev
server failed for those reasons alone.

Options:

- a prefix of a story id or title plays only that area: `zen-stories core-primitives`,
  `zen-stories Music/Components`
- `--workers N`: how many stories play at once, 2 by default. The two runs, virtual DOM and
  browser, take turns, so no more than N stories are ever being played.
- `--url URL`: the served Storybook, for `browser` and `stage` stories. By default the port in
  the project's `storybook` script, when something answers there, or `STORYBOOK_URL`.
- `--list`: prints each story and where it would be played, and plays nothing.
- `--timeout MS`: per story, 90000 by default.

Each story gets one line, `pass` or `FAIL`, with its time, and `[browser]` when it played in
the headless shell. Under a failure is what it threw. The last line counts what passed on the
virtual DOM, what passed in the browser, what was skipped and what failed. The runner exits 1
when a story fails or a story that should have been played was not (the headless shell is
missing, no Storybook is served).

## Tags

| Tag | Means |
| --- | --- |
| `browser` | the story needs a real browser. It never plays on the virtual DOM. |
| `stage` | the story is drawn by the Omarchy stage in Qt (`harness-omarchy.md`). It needs a stage server and is skipped, with the reason, where none answers. |
| `!test` | Storybook's own: the story is not a test. No run plays it; it is counted as skipped. For a story only a script of its own can play (zen's manual stories read evidence `scripts/check-manual-stories.mjs` serves). |

Put a tag on a story (`tags: ['browser']`) or on a file's meta to cover every story in it.
Storybook's sidebar can filter by tag, so a reader can list the stories that need a browser.

**When to tag `browser`.** Run the area on the virtual DOM and read each failure:

- the story measures a size or position, scrolls, draws on a canvas, reads a computed colour,
  or depends on layout or focus that only a laid-out page has: tag it;
- the story or component assumed a browser where it did not need one (a module that fails to
  load, a `fetch` of a relative URL, an API used before checking it exists): fix it.

The runner never tags a story for you.

## The stand-ins

So that modules written for a browser load on the virtual DOM, the runner installs these before
anything of the project's loads, and nothing else:

- `ResizeObserver` and `IntersectionObserver`, which observe nothing;
- `window.matchMedia`, which matches nothing;
- `Element.prototype.scrollIntoView`, which does nothing;
- `HTMLCanvasElement.prototype.getContext`, which returns null.

They let a module load; they lay nothing out and draw nothing. A story that needs more than
these needs a browser.

## Stage stories

A story tagged `stage` plays on the virtual DOM like any other: its `<OmarchyStage>` starts the
plugin's Qt session on the served Storybook's stage server, the play drives it through
`stageOf(canvasElement)` as in a page, and the session ends with the story. No browser is
started. Stories about the stage's own page (its frame, clicking and typing on the canvas) are
tagged `stage` and `browser`, and play in the headless shell against the served Storybook.

GitHub's runners have no Quickshell, so stage stories are skipped there and played on a
machine that has it.

## In CI

zen's `.github/workflows/stories.yml` is a reusable workflow: on a pull request it runs
`zen-stories --no-browser`; on a push to the default branch it installs only the headless shell,
serves the Storybook's dev server on port 6006, and runs `zen-stories --browser-all` against it.
A repo calls it with:

```yaml
name: Stories
on:
  pull_request:
  push:
    branches: [main]
jobs:
  stories:
    uses: satoramoto/zen/.github/workflows/stories.yml@main
```

## How it works

- **Which stories.** Storybook's own indexer reads the stories globs, with no server and no
  module loaded, and gives each story's id, title, file and tags.
- **The virtual DOM.** Vitest on jsdom. Each stories file the run plays is its own test file,
  one test per story, named by the story's id; Vitest spreads the files over `--workers`
  threads. Each story is composed with Storybook's portable stories under the project's preview
  and run with `run()`, so its decorators, loaders, args and play behave as in Storybook, and it
  is unmounted when its test ends. Files in a worker share their modules: isolating each file
  cost three times the CPU for the same results.
- **The browser.** Each story is opened in its own page at `iframe.html?id=…` in Playwright's
  Chromium headless shell, and judged by the events Storybook's channel sends.
