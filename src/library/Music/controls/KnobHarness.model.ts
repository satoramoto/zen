/** Story-only controlled host, shared unchanged by the two renderer harnesses. */
import { component, h, wire, type Handlers } from '../../view/Tree.model';
import type { NumberFieldProps } from './NumberField.model';
import type { SliderProps } from './Slider.model';
export interface ParameterHarnessProps extends SliderProps, Pick<NumberFieldProps, 'editable' | 'showFill' | 'width'> {
  control: 'knob' | 'slider' | 'number';
  hostValue?: number;
}
export interface ParameterHostState { given: number; value: number; depth?: number }
export function parameterHostView(props: ParameterHarnessProps, held: ParameterHostState) {
  const { control, hostValue: _hostValue, onChange: _onChange, onRelease: _onRelease, onDepth, ...data } = props;
  const state = held.given === props.value ? held : { given: props.value, value: props.value, depth: props.depth };
  return h('div', { style: 'display: grid; justify-items: center; gap: 16px; min-width: 260px' },
    component(control === 'knob' ? 'MusicKnob' : control === 'slider' ? 'MusicSlider' : 'MusicNumberField', { ...data, value: state.value, depth: state.depth }, {
      on: { onChange: 'change', onRelease: 'release', ...(onDepth === undefined ? {} : { onDepth: 'depth' }) },
    }),
    wire(h('button', { type: 'button' }, 'Host update'), { on: { click: 'host' } }),
  );
}
export function parameterHostHandlers(props: ParameterHarnessProps, get: () => ParameterHostState, set: (state: ParameterHostState) => void): Handlers {
  const current = () => get().given === props.value ? get() : { given: props.value, value: props.value, depth: props.depth };
  return {
    change(value: number) { props.onChange(value); set({ ...current(), value }); },
    release: props.onRelease,
    depth(depth: number) { props.onDepth?.(depth); set({ ...current(), depth }); },
    host() { set({ ...current(), value: props.hostValue ?? 80 }); },
  };
}
