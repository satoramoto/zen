import type { ReactNode } from 'react';

export interface AxisPickerProps {
  /** The measures it can show, as their names ("Speed", "Brightness"…). */
  items: readonly string[];
  /** The one shown. */
  index: number;
  /** Fires only on a change. */
  onChange(next: number): void;
  /** The accessible name: which axis it picks ("Across", "Up", "Colour"). */
  label: string;
  /** `horizontal` (under a plot, or in a title row) or `vertical` (along a plot's left edge, reading bottom to top). */
  orientation?: 'horizontal' | 'vertical';
  /** The low end's word ("slow"), at the start of the axis (left, or the bottom when vertical); none when left out. */
  low?: ReactNode;
  /** The high end's word ("fast"), at the end of the axis (right, or the top when vertical); none when left out. */
  high?: ReactNode;
  disabled?: boolean;
  title?: string;
  className?: string;
}

/** Stub: the shared export lands first; the component follows in its own commit. */
export function AxisPicker(props: AxisPickerProps) {
  void props;
  return null;
}

export default AxisPicker;
