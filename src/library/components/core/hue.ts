// Shared colour slots for library components. An app decides what each slot means (Yahaha: the
// four keyboard parts take hues 1–4, role 1 is the current style, role 2 the transport); a
// component only names the slot.

/** One of the contract's four categorical hues: `--hue-1` … `--hue-4`. */
export type HueSlot = 1 | 2 | 3 | 4;

/** One of the contract's two role hues: `--role-1` / `--role-2` (ink on a solid fill: `--role-n-text`). */
export type RoleSlot = 1 | 2;
