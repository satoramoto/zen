# Yahaha redesigns

Each Yahaha widget, redesigned from first principles on the library's token contract. The original stays in `yahaha/src/ui/<Name>/` (Svelte), shown in Storybook under "Yahaha baseline"; the redesign is React and sits under "Library/Yahaha".

## One folder per widget

```
src/library/yahaha/<Name>/
  <Name>.tsx          the component; props keep the original's meaning (names may improve)
  <Name>.css          its styles, classes prefixed `yh-<name>`
  <Name>.stories.tsx  title `Library/Yahaha/<Group>/<Name>`, decorator `withLibraryTheme`
  <Name>.test.tsx     behaviour the original's tests check (keyboard, steps, presses)
```

`<Group>` is the original's Storybook group: `Primitives`, `Components` or `Screens`.

## Rules

- Read only contract variables (`toCssVars()` in `../contract.ts`) or ones the widget declares itself. No literal colours or radii; `library.test.tsx` checks every file here.
- A widget may import another redesigned widget or `../components` once that code is on the base branch; never one still on another lane's branch.
- Keep the original's stories: the same story names and the same sample data, so each pair can be compared one to one. Add stories for states the original lacks.
- Keep what the original does for people: keyboard steps, wheel, press, a11y names. Change how it looks and is laid out.
- It must read well under every theme pack in the toolbar, not only `yahaha-push`.
- Colour means what `hues.ts` says: the four hues are the four parts; sections and other states use contract roles. Import its maps rather than writing your own.
- The Stage and its regions follow `STAGE.md`.

## What each redesign records

The component's doc comment (shown on the story's docs page) says, in a few plain sentences:

1. **Job**: what the widget is for and what a player needs from it at a glance.
2. **Changed**: what differs from the original and why, naming the principle (hierarchy, contrast, alignment, rhythm, colour meaning, numerals, affordance). Cite the `refero-design` skill's references (`.claude/skills/refero-design/references/`) where they apply.
3. **Kept**: what the original already did right.
