import type { ComponentProps } from 'svelte'
import type Button from '../Button/Button.svelte'

/** A text hue for a detail value or the badge: the accent, a status, a part, or the caption ink. */
export type DetailHue = 'a' | 'warn' | 'ok' | 'r1' | 'r2' | 'r3' | 'l' | 'm'

/** One value of a field: a text in its hue (default `--t`). */
export type DetailValue = { text: string; hue?: DetailHue }

/** One field row: its label and one or more values ("Playing on: Right 2, Left"). */
export type DetailField = { label: string; values: DetailValue[] }

/** Button's hue (the colour token, without `--`). */
export type ButtonHue = NonNullable<ComponentProps<typeof Button>['hue']>

/** One action button. */
export type DetailAction = {
  /** Passed to `onaction` when pressed. */
  id: string
  /** The button's label. */
  label: string
  /** The page's main action: Button's chosen face. */
  primary?: boolean
  /** Shown, not pressable. */
  disabled?: boolean
  /** Button's hue (e.g. `ending` for Delete). Default neutral. */
  hue?: ButtonHue
  /** The tooltip key. */
  tip?: string
  /** The accessible name, when the label alone isn't enough. */
  name?: string
}

/** A row of action buttons, with an optional note after it. */
export type DetailActionRow = { actions: DetailAction[]; note?: string }
