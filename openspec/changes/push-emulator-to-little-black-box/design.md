# Design

## Context

See proposal.md for why. Today the emulator is built from zen's inside: its models return view
trees (`foundation/view/Tree.model.ts`), its layouts are drawn by `Tree.tsx` and `Tree.svelte`,
its parts and stores are found by name through registries in `foundation/view/` that import
`push/registry.*.ts`, and its stories use `withRenderer`, `treeStory` and `defineFixtures`. None
of that is public. The package's only way in is its entries (`AGENTS.md`, "Library rules"), and
an app must not reach a deeper path. So the move is two halves: zen makes its view runtime a
public, extensible entry; then the emulator moves and uses it.

little-black-box is a private research repository with a Storybook on port 6042 drawn in the
`textbook-console` pack, React only, no unit test runner, no OpenSpec root, and zen pinned by
commit. Another agent's branch and two uncommitted files are live in its checkout.

## Goals / Non-Goals

**Goals:**

- The emulator behaves and renders exactly as it does in zen today, in both renderers.
- Its rules hold where it lands: the contract, the tiers, bindings-only, and stories as the spec.
- zen keeps nothing Push-specific except the `push-3` pack and the lamp table, which are theme
  facets like any other.

**Non-Goals:**

- Changing the emulator's behaviour, its specs or its stories' words.
- Merging the emulator into the research site's pages, or reading its records.
- Publishing little-black-box.

## Decisions

### D1. zen gains a `view` entry, one per renderer

`@satoramoto/zen/view` (framework-free: `h`, `component`, `wire`, `styleText`, the node types,
`textNode`, `iconNode`, the store contract `bindX(node, params)`), `@satoramoto/zen/view/react`
(`Tree`, `registerComponents`, `registerStores`) and `@satoramoto/zen/view/svelte` (the same for
Svelte). The registries become maps an app adds to, rather than imports of `push/registry.*.ts`.
A name an app registers that zen already has is refused, so an app cannot replace a zen part.

*Alternative:* keep the emulator's layouts as plain React and Svelte components outside the view
tree. Rejected: it would be a rewrite of every layout, and the two renderers would drift.

### D2. The storybook helpers join `@satoramoto/zen/storybook`

`withRenderer`, `treeStory`, `fixtureStories` and `defineFixtures` are exported for an app's
Storybook. *As built:* they are their own entry, `@satoramoto/zen/storybook/renderers`, beside
`@satoramoto/zen/storybook` rather than in it, because they mount Svelte, an optional peer, and a
React-only app (the source map site among them) imports `/storybook` without Svelte installed.
`defineFixtures` also comes from `@satoramoto/zen/view`, so fixtures and the node tests that read
them need no Svelte. The emulator also needed `ThemeInspector` (now in the main entry) and the
lamp table (`/themes`).

### D3. The rule checks become functions over a folder

`@satoramoto/zen/checks` exports `checkContract(dir)`, `checkTiers(dir, baseline)` and
`checkBindingsOnly(dir, baseline)`, each returning the findings, and zen's own tests call the same
functions on `src/library`. little-black-box's tests call them on `src/push` with a baseline of
zero, as zen holds the area today.

*Alternative:* copy the checks into little-black-box. Rejected: two copies of a rule drift, and
the rule is zen's.

### D4. The area moves whole, to `src/push/`

Same folders, same files. Relative imports into zen become imports from zen's entries; nothing
else in a file changes. The stories' titles keep `Push/…`. The tree snapshots move with their
fixtures to little-black-box's own snapshot test, and are compared byte for byte with zen's
before zen deletes them.

### D5. Both renderers stay

The emulator is for developers building on either renderer, and the plays prove both. So
little-black-box gains `svelte` and the Svelte Vite plugin as dev dependencies, and its
Storybook mounts the Svelte trees as zen's does.

*Alternative:* React only. Smaller, and the research site is React only, but it halves the
evidence the plays give and drops a promise the specs make.

### D6. little-black-box gets its own OpenSpec root, bootstrapped from the stories

It is not in the satoramoto family, so it plans locally (`openspec/`, schema `zen-flow`), as
`AGENTS.md` says of other repos. Its README says to add one only on an explicit request: this
change is that request, and the approval at Ready confirms it. Its main specs are written by
`story-spec sync --specs --dir src/push` from the moved stories, so they are the requirements zen
has, word for word. The two change histories (`push-3-surface`, `push-3-fidelity`) stay in zen's
archive, where they happened.

### D7. Three merges, in order

1. zen: the new entries and the registries as maps (a change branch and pull request).
2. little-black-box: the emulator, pinned to the commit of step 1, in a worktree, on
   `change/push-emulator-to-little-black-box`, merged locally or by pull request as its
   `zen-flow doctor --merge-path` says.
3. zen: the area, its specs and its exports removed (the same change branch, a second pull
   request), only after step 2 has merged.

At every commit of either repo the emulator exists and passes.

## Risks / Trade-offs

- [A public view entry is a promise zen must keep] → It exposes only what the emulator uses
  today, each export with a one-line doc; the store contract is already the documented one.
- [Two registries' names collide] → registration refuses a taken name and says which.
- [little-black-box's other work] → everything happens in the worktree; its research tools,
  records and pages are untouched, and `check:stories` proves the pages still render.
- [The snapshots differ after the move because a path changed] → they are compared before zen's
  copies are deleted; any difference stops the change.
