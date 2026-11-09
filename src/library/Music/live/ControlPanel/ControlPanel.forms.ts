// ControlPanel's forms (docs/assembly.md): a grid of controls, at least a few control heights each
// way; it grows into whatever room the panel's share gives it. One form: the grid stays the
// person's, never rearranged.
import type { Forms } from '../../../layout/assembly';

export type ControlPanelForm = 'grid';

export const CONTROL_PANEL_FORMS: Forms<ControlPanelForm> = [
  {
    id: 'grid',
    min: { w: { control: 6 }, h: { control: 3 } },
    ideal: { w: { control: 12 }, h: { control: 6 } },
    grow: { w: true, h: true },
  },
];
