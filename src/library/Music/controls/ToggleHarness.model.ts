/** Story-only controlled parent: the same host state and callbacks in both renderers. */
import { component, h, wire, type Handlers } from '../../view/Tree.model';
import type { ToggleModelProps } from './Toggle.model';
import type { SegmentedModelProps } from './Segmented.model';
import type { SelectModelProps } from './Select.model';
import type { MomentaryModelProps } from '../mixer/Momentary.model';

export type PressableHarnessProps = (
  | ({ control: 'toggle' } & ToggleModelProps)
  | ({ control: 'segmented' } & SegmentedModelProps)
  | ({ control: 'select' } & SelectModelProps)
  | ({ control: 'momentary' } & MomentaryModelProps)
) & { children?: string };
export interface PressableHostState { given: number | boolean; value: number | boolean }
const given = (props: PressableHarnessProps) => props.control === 'toggle' ? props.on : props.control === 'momentary' ? props.held : props.index;
export const pressableHostInitial = (props: PressableHarnessProps): PressableHostState => ({ given: given(props), value: given(props) });
const current = (props: PressableHarnessProps, state: PressableHostState) => state.given === given(props) ? state : pressableHostInitial(props);

export function pressableHostView(props: PressableHarnessProps, state: PressableHostState) {
  const { control, children, ...rest } = props;
  const data = Object.fromEntries(Object.entries(rest).filter(([, value]) => typeof value !== 'function'));
  const value = current(props, state).value;
  data[control === 'toggle' ? 'on' : control === 'momentary' ? 'held' : 'index'] = value;
  const name = { toggle: 'MusicToggle', segmented: 'MusicSegmented', select: 'MusicSelect', momentary: 'MusicMomentary' }[control];
  return wire(h('div', { class: 'wdg', style: control === 'toggle' && props.layout === 'inside' ? 'min-width: 180px' : undefined }, h('div', {}, component(name, data, {
    on: control === 'momentary' ? { onHold: 'change', onTakeover: 'takeover' } : { onChange: 'change' },
    slots: { children: [children ?? ''] },
  }))), { bind: [['musicPressableHost', { given: given(props), onGiven: 'given' }]] });
}
export function pressableHostHandlers(props: PressableHarnessProps, get: () => PressableHostState, set: (state: PressableHostState) => void): Handlers {
  return {
    given(value: number | boolean) { set({ given: value, value }); },
    change(value: number | boolean) {
      if (props.control === 'toggle') props.onChange?.(value as boolean);
      else if (props.control === 'momentary') props.onHold(value as boolean);
      else props.onChange?.(value as number);
      set({ ...current(props, get()), value });
    },
    takeover: props.control === 'momentary' ? props.onTakeover : undefined,
  };
}
