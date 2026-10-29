import { Children, type ReactNode } from 'react';
import { Tree } from '../../view/Tree';
import { knobStackView, type KnobStackProps } from './KnobStack.model';

export type { KnobStackProps } from './KnobStack.model';

export function KnobStack({ children, count, ...props }: KnobStackProps & { children?: ReactNode; [slot: `knob${number}`]: ReactNode }) {
  const knobs = Children.toArray(children);
  return <Tree tree={knobStackView({ ...props, count: count ?? knobs.length })} slots={{ ...props, ...Object.fromEntries(knobs.map((knob, index) => [`knob${index}`, knob])) }} />;
}
