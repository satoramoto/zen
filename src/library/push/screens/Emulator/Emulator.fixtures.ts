// Emulator's stories as plain props.
import { defineFixtures } from '../../../fixtures';
import { sampleSet } from '../../model/sample';
import type { EmulatorModelProps } from './Emulator.model';

const control = () => {
  const set = sampleSet();
  set.unit.mode = 'control';
  return set;
};

export const emulatorStories = defineFixtures<EmulatorModelProps>()({
  /** The sample Set, standalone, with the stand-in host answering. */
  Sample: { args: { set: sampleSet() } },
  /** Control Mode: User Mode is offered. */
  ControlMode: { args: { set: control() } },
  /** The host refuses everything: the device shows only what it is given. */
  Refusing: { args: { set: sampleSet(), host: false } },
  /** The device alone, no panels. */
  Bare: { args: { set: sampleSet(), panels: false } },
});
