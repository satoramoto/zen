// HealthSlot's stories as plain props: HealthSlot.stories.tsx draws them with either renderer, and
// the tree snapshot renders every instance.
import { defineFixtures, instances } from '../../fixtures';
import { component, h, type Node } from '../../view/Tree.model';
import type { HealthSlotModelProps } from './HealthSlot.model';

/** The controls, the same in both Storybooks. */
export const healthSlotArgTypes = {
  failedPart: { control: 'select', options: [null, 0, 1, 2, 3] },
  synthOn: { control: 'boolean' },
  dropouts: { control: { type: 'number', min: 0, step: 1 } },
  bufferFrames: { control: 'select', options: [null, 64, 128, 256, 512, 1024] },
  cpu: { control: { type: 'range', min: 0, max: 1.2, step: 0.01 } },
  width: { control: { type: 'number', min: 0, step: 1 } },
  tip: { control: 'text' },
} as const;

/** Every story's args start from these. */
export const healthSlotArgs = { tip: 'app.health' } as const;

export const healthSlotStories = defineFixtures<HealthSlotModelProps>()({
  Board: { args: { ...healthSlotArgs, failedPart: null, synthOn: true, dropouts: 0, bufferFrames: 256, cpu: 0.2, width: 100 } },
  Cpu: { args: { ...healthSlotArgs, synthOn: true, dropouts: 0, bufferFrames: 256, cpu: 0.74, width: 100 } },
  Failed: { args: { ...healthSlotArgs, failedPart: 2, synthOn: true, bufferFrames: 256, cpu: 0.2, width: 100 } },
  FailedBeatsOff: { args: { ...healthSlotArgs, failedPart: 3, synthOn: false, width: 100 } },
  AudioOff: { args: { ...healthSlotArgs, synthOn: false, width: 100 } },
  Dropouts: { args: { ...healthSlotArgs, dropouts: 2, bufferFrames: 256, cpu: 0.2, width: 100 } },
  OneDropout: { args: { ...healthSlotArgs, dropouts: 1, bufferFrames: 256, width: 100 } },
  BufferHint: { args: { ...healthSlotArgs, dropouts: 3, bufferFrames: 128, cpu: 0.74 } },
  BufferHintInBar: { args: { ...healthSlotArgs, dropouts: 3, bufferFrames: 128, width: 100 } },
  LargestBuffer: { args: { ...healthSlotArgs, dropouts: 3, bufferFrames: 1024, width: 100 } },
  AllStates: {
    args: healthSlotArgs,
    items: [{}, { synthOn: false }, { cpu: 0.74 }, { dropouts: 2 }, { failedPart: 2 }],
  },
});

/** The AllStates story: every state side by side in a 220px bar-like strip, each item over the
 *  story's args (their data; `onOpen` is the handler `open`). */
export function healthSlotAllStates(args: HealthSlotModelProps): Node {
  const data = Object.fromEntries(Object.entries(args).filter(([, value]) => typeof value !== 'function'));
  return h(
    'div',
    { style: 'display: grid; gap: var(--space-2); width: 220px' },
    instances({ args: data, items: healthSlotStories.AllStates.items }).map((props, i) =>
      component('HealthSlot', props, { on: { onOpen: 'open' }, key: String(i) }),
    ),
  );
}
