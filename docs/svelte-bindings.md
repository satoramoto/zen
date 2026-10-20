# Svelte bindings: porting a component

Every zen component renders in React and in Svelte 5 from one framework-free model, with the same markup, classes and data attributes, so one stylesheet styles both. Button (`src/library/components/core/Button/`) is the worked example; Text and Stack (`src/library/primitives/`) are the simple ones.

## The files of one component

| File | What it holds |
|---|---|
| `Button.model.ts` | The props (`ButtonModelProps`: everything but framework-specific children such as `icon`), and `buttonView(props)`: the face's class, its `data-*`, ARIA, `type` and `title` (each a string or undefined), the label, the glyph. Pure helpers (`clickPresses`). No React, no Svelte. |
| `longPress.ts`, `hold.ts` | Stateful logic as framework-free stores: `bindLongPress(node, params)` returns `{ update, destroy }`; `createHold(getNode, getOnHold)` returns `{ down, end, stop }`. |
| `useLongPress.ts` | The React hook over `bindLongPress`. |
| `longPress.svelte.ts` | The Svelte action over `bindLongPress` (`use:longPress`, or through a component: `{@attach fromAction(longPress, () => params)}`). |
| `Button.tsx` | Renders `buttonView` in React; wires the stores with refs and effects. |
| `Button.svelte` | Renders `buttonView` in Svelte, the same markup; wires the same stores with `$effect` and attachments. |
| `Button.css` | Shared as is (contract variables only). |
| `Button.fixtures.ts` | Every story's args as plain data (`defineFixtures<ButtonModelProps>()({ Board: { args }, Role2: { items } })`), plus the controls (`buttonArgTypes`) and any lists the stories lay out. No callbacks: each Storybook adds its own spies. |
| `Button.stories.tsx` | React stories, args from the fixtures, `play` functions for behaviours. |
| `Button.stories.svelte.ts` | Svelte stories, the same story names, `story(s.Board)` from `fixtureStory(Button)` (`src/library/svelte/stories/story.ts`). A story with `items` draws them in a row. |
| `Button.story.svelte` | Only when a Svelte story needs markup (children, a grid): see `Stack.story.svelte`, `Text.story.svelte`. |

## Rules

- **Nothing either renderer would copy.** If `Button.tsx` computes it, it goes in the model or a store. A renderer only maps the view onto elements and forwards events.
- **Same DOM.** No whitespace text between elements in the `.svelte` markup where React has none (write `{/if}{#if …}` adjacent); attribute values come from the model as strings (`aria-pressed: 'true'`), never booleans.
- **Svelte idioms.** Props are `$props()`, children and icons are snippets, `class` (not `className`) is the prop, an element ref is `bind:ref` (`$bindable`), handlers are `onclick` props. Actions and attachments pass through `Text` to its element (`{...rest}` spreads them).
- **Theme.** `ThemeScope.svelte` and the `theme` action (`src/library/svelte/theme.svelte.ts`) draw `scopeView` from `src/library/theme.model.ts`, as React's `ThemeScope` does. `getThemeScope()` is `useThemeScope()`; `systemMode.current` is `useSystemMode()`.
- **Tiers.** `src/library/tiers.ts` scans `.svelte` files: `<script>` as TS, `<style>` as CSS, `style="…"` and `style:prop` like `style={{}}`. New files keep every count at 0.

## Adding a component

1. Move its decisions into `<Name>.model.ts`, its state into stores; make `<Name>.tsx` render the model. Its tests and stories still pass.
2. Write `<Name>.svelte` rendering the same view.
3. Move its stories' args into `<Name>.fixtures.ts`; point `<Name>.stories.tsx` at them; write `<Name>.stories.svelte.ts` with the same names.
4. Add one line to `src/library/parity.test.tsx`: `parity('Name', Name, NameSvelte, nameStories);`
5. Report the export block it needs in `src/library/svelte.ts` (a shared file): `export const Name = NameSvelte as unknown as Component<NameProps>;`, with `NameProps` the model's props plus its snippets.
6. Checks: `npm run typecheck`, `npx vitest run src/library/parity.test.tsx`, `npx vitest run src/library/tiers.test.ts`, `npm run build:storybook:svelte`, `npm run build:lib`.

## Running the Storybooks

`npm run storybook:svelte` serves the Svelte Storybook on 6023. The React Storybook (`npm run dev`) shows it as the **Svelte** ref while it runs. To start both together: `SVELTE_STORYBOOK_PORT=6023 PREVIEW_PORT=4191 STORYBOOK_PORT=6022 npm run dev`.
