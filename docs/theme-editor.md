# Theme editor

Every zen app can offer zen's packs and a theme editor, and a skin made in one zen app works in
any other. The code is in `src/library/theme-editor/`. The stories are under
`Design OS/Theme Editor/`: Picker, Editor, and Bring your own app.

| Part | What it is | React? |
|---|---|---|
| `skin.ts` | the skin format and its helpers: `skinFromPack`, `applyOverrides`, `resolveSkin`, `validateSkin`, `serializeSkin`/`parseSkin`, and the editor's state changes (`setOverride`, `clearOverride`, `swapFacet`, `resetFacet`, `rebaseSkin`) | no |
| `colour.ts` | hex ⇄ HSL, WCAG contrast, OKLab distance, `paletteWarnings` | no |
| `persist.ts` | `loadSkin`/`saveSkin`/`forgetSkin`, guarded against storage that is missing, full or blocked | no |
| `SkinScope.tsx` | `SkinScope` (a `ThemeScope` wearing a skin), `SkinProvider` and `useSkin` | yes |
| `ThemePicker/`, `ThemeEditor/`, `ThemeSettings/` | the picker, the editor, and both together as one settings section | yes |

`resolveTheme` lives in `src/library/resolve.ts` with no React (`theme.tsx` re-exports it), so the
framework-free parts never import React.

## The skin format

A skin is a theme pack as plain JSON: a base pack, then optional facet swaps, then optional value
overrides.

```json
{
  "format": "zen-skin",
  "version": 1,
  "id": "linear-custom",
  "label": "Linear (custom)",
  "base": "linear",
  "facets": { "faces": "instrument" },
  "overrides": {
    "palette": { "dark": { "accent": "#ff7a59", "hues": [null, "#3fb8ff"] } },
    "scale": { "control": 32, "sizes": { "body": 15 } },
    "materials": { "radiusControl": "8px", "shaders": { "float": null } }
  }
}
```

- `base`: a pack id from `themes/packs.ts`. The pack also supplies the layout principles.
- `facets`: replaces a whole facet (`palette`, `faces`, `scale`, `materials`) with another named
  one from zen's facet lists. This is the same choice the Storybook toolbar offers.
- `overrides`: single values inside each facet, written in the contract's own shape (`Scheme`,
  `Faces`, `Scale`, `Materials` in `contract.ts`). Palette overrides are per mode. In a list, a
  `null` entry keeps the base value at that index. In `materials.shaders`, `null` removes that
  layer's shader. A facet's `id` and `label` are never overridden.
- Validation (`validateSkin`) accepts an override only where the contract has a value of the same
  type. Palette colours must be `#rrggbb`. Enums and numbers are checked against their allowed
  values and ranges. CSS values may not fetch anything: no `url()` except `data:`, no `@import`,
  no `image-set()`, and no `;`, `{` or `}` outside a data URL. This makes it safe to import a skin
  file from someone else.
- `serializeSkin` writes the normal form: the keys in a fixed order, nothing that changes nothing,
  and the override keys sorted. Equal skins therefore produce equal text, and
  `parseSkin(serializeSkin(s))` round-trips.
- Editing never leaves redundant values: setting a value back to the base's removes the override.
  The first edit renames the skin to `<base>-custom`.

## Adding it to a React app

Wrap the app once and put one component in its settings:

```tsx
import { SkinProvider, ThemeSettings } from '@satoramoto/zen';
import '@satoramoto/zen/zen.css';

<SkinProvider storageKey="myapp.skin" defaultSkin="linear" bleed>
  <App />
</SkinProvider>

// in the settings screen:
<ThemeSettings />
```

`SkinProvider` restores the skin from `localStorage[storageKey]` and keeps it there after every
change. If storage fails, the skin still applies for the current visit. `ThemeSettings` shows
light/dark, the picker and the editor. An app that wants its own layout can use `ThemePicker`
(`value`, `onChange`) and `ThemeEditor` (`skin`, `onChange`, `mode`). Both are controlled
components: the host owns persistence, as it did with mix's editor. Import and export are both
`*.zen-skin.json` files.

## Later: non-React hosts (Vue first, then Svelte)

ComfyUI is Vue with PrimeVue, so the first non-React binding is Vue. Svelte comes after it. Both
bindings wrap the same framework-free core, and none of them is built yet:

1. **The token contract as framework-free CSS.** `toCssVars(facets, mode)` already returns plain
   custom properties. Add a build step that writes each pack, or any resolved skin, as a
   stylesheet (`.zen-scope[data-mode=dark] { --surface-0: …; }`), plus `library.css` without the
   React components. Any page can then wear a pack with a class and no JavaScript.
2. **The skin core, unchanged.** `skin.ts`, `colour.ts`, `persist.ts` and `resolve.ts` import no
   framework. They need to ship as their own entry (for example `@satoramoto/zen/skin`) so a Vue
   app can import them without React. A binding should keep no logic of its own: the editor's
   state changes are `setOverride` and its siblings.
3. **Host adapters.** These map the contract variables onto a host's own design system. For
   ComfyUI, that is a PrimeVue preset (`definePreset`) whose semantic tokens read zen's variables
   (`primary` → `--action`, `surface` → `--surface-*`, `content` → `--text-*`). PrimeVue
   components then follow the skin, and so do zen's parts.
4. **The editor as a web component.** Build the React `ThemePicker`/`ThemeEditor` once as custom
   elements (`<zen-theme-settings>`) that take and emit skin JSON through attributes and events.
   A Vue or Svelte app can then embed the editor before it has native components. Native Vue and
   Svelte components can come later, built on the same core.
