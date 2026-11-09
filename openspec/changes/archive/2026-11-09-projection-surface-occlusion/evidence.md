# Verification

Implementation commits: 1744b0a, 3b56518. Protected code PR #182 merged after the checks job passed (2m36s). Planning PR #180 merged separately. Harmonigram pins the shipped 3b5651876c64ad4f43eb9db505ea62e9d7f9c4f6 revision through the public package.

- `npm run typecheck`: passed after building self-referencing public entries.
- `npx vitest run src/library`: 114 files, 1901 tests passed.
- `npm run build:lib`: passed.
- `npm run check:lib`: five entries respect framework boundaries.
- `npm run build:storybook`: passed.
- `story-spec sync --change projection-surface-occlusion --dir src/library/math/perspective/surface --check`: unchanged.
- `openspec validate projection-surface-occlusion --strict`: valid.
- Real-browser Explore and InspectContactFromBothSides stories: passed. The scenario rasterizes the SVG and verifies every interior pixel along a buried mark matches the covering fill; after camera reversal, the mark becomes visible and first-picked identity reverses.
- The same contact scenario passes at 390px without horizontal overflow.
- Consumer: five construction stories and seven existing wire-mode foundation stories pass. Pointer/touch checks pass at 390px, including identical screenshots after orbit/reverse/replay, surface-owned marks, animation and keyboard/reduced motion.
- Visual inspection: folded-corner cut edges stay visible, while buried mesh strokes and creases disappear. Mask half-pixel bleed closes antialias fringes without changing model geometry.

The user explicitly approved upstream archive and merge after verification. The separate origami-paper-game playable-model review remains pending; display metadata never certifies contact or enables folds.
