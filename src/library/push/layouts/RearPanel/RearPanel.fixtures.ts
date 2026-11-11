// RearPanel's stories as plain props.
import { defineFixtures } from '../../../fixtures';
import { sampleSet } from '../../model/sample';
import type { RearPanelModelProps } from './RearPanel.model';

export const rearPanelStories = defineFixtures<RearPanelModelProps>()({
  /** The sample Set's unit: a footswitch in Pedal 1, cables in the outputs, headphones, a USB device. */
  Sample: { args: { jacks: sampleSet().unit.jacks } },
  /** Nothing plugged in. */
  Empty: { args: {} },
});
