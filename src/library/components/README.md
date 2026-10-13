# Controls

**Where does this go?** What one control does: its state, keys, accessibility, its own size on the scale (`size`) and its colour slot (`tone`, `hue`). Never its outer margin or position, never a colour picked by hand. See [`docs/tiers.md`](../../../docs/tiers.md).

- `core/<Name>/`: controls any app builds with (Button, Toggle, Select, …), stories `Design OS/Components/Core/<Name>`.
- `music/<Name>/`: instrument parts (Fader, Knob, Pad, Keys, the readouts), stories `Design OS/Components/Music/<Name>`.

Controls build from the primitives (`../primitives/`: `Surface`, `Text`, `Icon`, `focusRing`). They carry no app meaning: colour is a slot (`core/hue.ts`) an app maps its meanings onto. A control's local custom properties (`--yh-*`) are listed under **Tuning knobs** in its doc comment. `src/library/tiers.test.ts` counts pixel values, outer margins and undeclared knobs here against `../tiers.baseline.json`.
