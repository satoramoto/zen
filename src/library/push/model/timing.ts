// Every time the model measures. The manual says "hold", "quickly" and "double-press" and gives no
// numbers, so each one here is added: they are the first things to tune against a unit
// (docs/push.md). Milliseconds.

/** A button held this long has been held, not pressed: its hold job begins. */
export const HOLD_MS = 450; // added

/** Two presses of one control this close together are a double press. */
export const DOUBLE_MS = 350; // added

/** Two taps of the Pedal 1 footswitch this close together are a double tap (New). */
export const PEDAL_DOUBLE_MS = 350; // added

/** How long a notice (a tempo, an octave, a layout's name) stays over the screen. */
export const NOTICE_MS = 1500; // added

/** How long the power button is held to switch the unit off. */
export const POWER_HOLD_MS = 3000; // added: the manual says "hold"; three seconds is the spec's own example

/** A turn with Shift held moves a parameter this fraction of a plain turn. */
export const FINE = 0.1; // added

/** One step of an encoder moves a continuous parameter this far through its range. */
export const TURN_STEP = 1 / 127; // added

/** Steps of an encoder to move one row of a list or one choice of a parameter. */
export const STEPS_PER_CHOICE = 4; // added
