// Region's stories as plain data: Region.stories.tsx (React) and Region.stories.svelte.ts (Svelte)
// both draw them, and parity.test.tsx renders every story's Region in both. The tabbed stories
// (WithViews, AsideSwitch) are React only until the Svelte `Tabs` exists; their args live here too.
import { defineFixtures } from '../fixtures';
import type { Step } from '../primitives/step';
import type { RegionModelProps } from './Region.model';

/** The stories' controls. */
export interface RegionArgs {
  name: string;
  label: string;
  aside: string;
  view: string;
  disableSends: boolean;
  gap: Step;
}

export const regionArgs: RegionArgs = { name: 'Mixer', label: 'Mixer', aside: '', view: 'faders', disableSends: false, gap: 3 };

export const regionArgTypes = {
  name: { control: 'text' },
  label: { control: 'text' },
  aside: { control: 'text' },
  view: { control: 'inline-radio', options: ['faders', 'sends', 'parts'] },
  disableSends: { control: 'boolean' },
  gap: { control: { type: 'range', min: 0, max: 6, step: 1 } },
} as const;

/** Each story's args over `regionArgs`. */
export const regionStoryArgs = {
  Groups: { name: 'Pads', label: 'Pads' },
  Plain: { aside: '8 strips' },
  Headless: { label: '' },
  WithViews: { label: '' },
  AsideSwitch: {},
} satisfies Record<string, Partial<RegionArgs>>;

/** The Groups story's groups: each one's name and its buttons' labels. */
export const REGION_GROUPS = [
  { name: 'Sections', labels: ['Intro', 'Main A', 'Main B', 'Ending'] },
  { name: 'Transport', labels: ['Sync Start', 'Start / Stop'] },
];

/** The body text of the stories that hold a note. */
export const REGION_NOTES = {
  Plain: 'The region body: groups of controls go here.',
  Headless: 'A region with nothing in its header draws no header strip.',
};

/** A Region's props in parity fixtures: the model's, with the label and aside as text. */
export type RegionFixtureProps = RegionModelProps & { label?: string; aside?: string };

/** The Region props for a story's args (an empty label or aside is none); `gap` only where the story sets it. */
export const regionProps = ({ name, label, aside, gap }: RegionArgs, withGap = false): RegionFixtureProps => ({
  name,
  label: label || undefined,
  aside: aside || undefined,
  ...(withGap ? { gap } : {}),
});

const args = (story: keyof typeof regionStoryArgs): RegionArgs => ({ ...regionArgs, ...regionStoryArgs[story] });

/** The parity fixtures: each untabbed story's Region, its content standing in as text. */
export const regionStories = defineFixtures<RegionFixtureProps>()({
  Groups: { args: { ...regionProps(args('Groups'), true), children: REGION_GROUPS.map((g) => g.name).join(', ') } },
  Plain: { args: { ...regionProps(args('Plain')), children: REGION_NOTES.Plain } },
  Headless: { args: { ...regionProps(args('Headless')), children: REGION_NOTES.Headless } },
});
