// Story-only controlled host. State echoes are ordinary host updates, not updateArgs calls:
// Storybook resets instrumented mocks when args rerender during a play.
import type { MixerCommands, MixerState } from './model';

export function createMasterStripHost(initial: MixerState, callbacks: MixerCommands) {
  let state = initial;
  const listeners = new Set<(state: MixerState) => void>();
  const patch = (change: (current: MixerState) => Partial<MixerState>) => {
    state = { ...state, ...change(state) };
    listeners.forEach(listener => listener(state));
  };
  const commands: MixerCommands = {
    ...callbacks,
    setRunning(value) { callbacks.setRunning(value); patch(() => ({ running: value })); },
    stopAll() { callbacks.stopAll(); patch(() => ({ running: false, beat: 0 })); },
    setMaster(control, value) { callbacks.setMaster(control, value); patch(() => ({ [control]: value })); },
    setMasterEq(band, value) {
      callbacks.setMasterEq(band, value);
      patch(current => ({ masterEq: current.masterEq.map((v, i) => i === band ? value : v) }));
    },
    setEffect(slot, id) { callbacks.setEffect(slot, id); patch(() => slot === 'A' ? { fxA: id } : { fxB: id }); },
  };
  if (callbacks.setEffectParam) commands.setEffectParam = (slot, effect, control, value) => {
    callbacks.setEffectParam?.(slot, effect, control, value);
    patch(current => ({ effectValues: { ...current.effectValues, [slot]: {
      ...current.effectValues?.[slot], [effect]: { ...current.effectValues?.[slot]?.[effect], [control]: value },
    } } }));
  };
  if (callbacks.setEffectEnabled) commands.setEffectEnabled = (slot, enabled) => {
    callbacks.setEffectEnabled?.(slot, enabled);
    patch(current => ({ effectEnabled: { A: true, B: true, ...current.effectEnabled, [slot]: enabled } }));
  };
  if (callbacks.setEffectHighPass) commands.setEffectHighPass = (slot, value) => {
    callbacks.setEffectHighPass?.(slot, value);
    patch(current => ({ effectHighPass: { A: 0, B: 0, ...current.effectHighPass, [slot]: value } }));
  };
  if (callbacks.setEffectsEnabled) commands.setEffectsEnabled = enabled => {
    callbacks.setEffectsEnabled?.(enabled); patch(() => ({ effectsEnabled: enabled }));
  };
  if (callbacks.setPhones) commands.setPhones = (control, value) => {
    callbacks.setPhones?.(control, value); patch(() => ({ [control]: value }));
  };
  return {
    commands,
    getSnapshot: () => state,
    subscribe(listener: (state: MixerState) => void) {
      listeners.add(listener);
      listener(state);
      return () => { listeners.delete(listener); };
    },
  };
}
