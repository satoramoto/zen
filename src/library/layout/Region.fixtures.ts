// Region's stories as plain data: Region.stories.tsx draws them, as view trees (`regionSample`)
// that React's or Svelte's `Tree` renders, and the tree snapshot (view/snapshot.test.ts) records
// both `regionView` for every fixture of `regionStories` and every story's sample.
import { defineFixtures } from '../fixtures';
import type { Step } from '../primitives/step';
import { component, h, type Child, type Node } from '../view/Tree.model';
import type { RegionModelProps } from './Region.model';

/** The stories' controls. */
export interface RegionArgs {
  name: string;
  label: string;
  aside: string;
  view: string;
  disableSends: boolean;
  gap: Step;
  /** AsideSwitch: the chosen layer of the aside's switch. */
  layer: string;
}

export const regionArgs: RegionArgs = { name: 'Mixer', label: 'Mixer', aside: '', view: 'faders', disableSends: false, gap: 3, layer: 'a' };

export const regionArgTypes = {
  name: { control: 'text' },
  label: { control: 'text' },
  aside: { control: 'text' },
  view: { control: 'inline-radio', options: ['faders', 'sends', 'parts'] },
  disableSends: { control: 'boolean' },
  gap: { control: { type: 'range', min: 0, max: 6, step: 1 } },
  layer: { control: 'inline-radio', options: ['a', 'b'] },
} as const;

/** Each story's args over `regionArgs`. */
export const regionStoryArgs = {
  Groups: { name: 'Pads', label: 'Pads' },
  Plain: { aside: '8 strips' },
  Headless: { label: '' },
  WithViews: { label: '' },
  AsideSwitch: {},
} satisfies Record<string, Partial<RegionArgs>>;

export type RegionStory = keyof typeof regionStoryArgs;

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

/** The WithViews story's views: each one's tab and its body's note. */
export const REGION_VIEWS = [
  { id: 'faders', label: 'Faders', note: 'Faders: one strip per part.' },
  { id: 'sends', label: 'Sends', note: 'Sends: reverb and delay per part.' },
  { id: 'parts', label: 'Parts', note: 'Parts: voice, octave and transpose.' },
];

/** The AsideSwitch story's second switch. */
export const REGION_LAYERS = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
];

/** A Region's props in fixtures: the model's, with the label and aside as text. */
export type RegionFixtureProps = RegionModelProps & { label?: string; aside?: string };

/** The Region props for a story's args (an empty label or aside is none); `gap` only where the story sets it. */
export const regionProps = ({ name, label, aside, gap }: Pick<RegionArgs, 'name' | 'label' | 'aside' | 'gap'>, withGap = false): RegionFixtureProps => ({
  name,
  label: label || undefined,
  aside: aside || undefined,
  ...(withGap ? { gap } : {}),
});

const args = (story: RegionStory): RegionArgs => ({ ...regionArgs, ...regionStoryArgs[story] });

/** The fixtures: each untabbed story's Region, its content standing in as text. */
export const regionStories = defineFixtures<RegionFixtureProps>()({
  Groups: { args: { ...regionProps(args('Groups'), true), children: REGION_GROUPS.map((g) => g.name).join(', ') } },
  Plain: { args: { ...regionProps(args('Plain')), children: REGION_NOTES.Plain } },
  Headless: { args: { ...regionProps(args('Headless')), children: REGION_NOTES.Headless } },
});

/* ---------- the stories as view trees (Region holding registered components) ---------- */

/** A sample's args: the story's controls and which story it is. */
export type RegionSampleArgs = RegionArgs & { story: RegionStory };

/** Every story's args, for the sample snapshot. */
export const regionSampleStories = defineFixtures<RegionSampleArgs>()(
  Object.fromEntries((Object.keys(regionStoryArgs) as RegionStory[]).map((story) => [story, { args: { ...args(story), story } }])) as Record<
    RegionStory,
    { args: RegionSampleArgs }
  >,
);

const note = (text: string): Child => h('p', { style: 'margin: 0; color: var(--text-2)' }, text);
const frame = (region: Child): Node => h('div', { style: 'max-width: 560px' }, region);

/** The Groups story's body: a Group per `REGION_GROUPS` entry, its Buttons (Start / Stop the primary). */
const groups = (): Child[] =>
  REGION_GROUPS.map((g) =>
    component(
      'Group',
      { name: g.name },
      {
        key: g.name,
        slots: { children: g.labels.map((label, i) => component('Button', { label, variant: g.name === 'Transport' && i === 1 ? 'primary' : undefined }, { key: label })) },
      },
    ),
  );

/**
 * A story's tree. Groups: Groups of Buttons in the body. Plain, Headless: a note. WithViews: a
 * view per `REGION_VIEWS` entry, the `view` control choosing (a tab asks `onView`, handler `view`),
 * the chosen view's note as the body. AsideSwitch: layer `Tabs` in the aside (handler `layer`).
 */
export function regionSample(a: RegionSampleArgs): Node {
  if (a.story === 'Groups') return frame(component('Region', { ...regionProps(a, true) }, { slots: { children: groups() } }));
  if (a.story === 'Plain' || a.story === 'Headless') return frame(component('Region', { ...regionProps(a) }, { slots: { children: [note(REGION_NOTES[a.story])] } }));
  if (a.story === 'WithViews') {
    const views = REGION_VIEWS.map(({ id, label }) => ({ id, label, disabled: id === 'sends' && a.disableSends ? true : undefined }));
    const shown = REGION_VIEWS.find((v) => v.id === a.view) ?? REGION_VIEWS[0];
    return frame(component('Region', { ...regionProps(a), views, view: a.view }, { on: { onView: 'view' }, slots: { children: [note(shown.note)] } }));
  }
  const layers = component('Tabs', { name: 'Layer', items: REGION_LAYERS, value: a.layer }, { on: { onChange: 'layer' } });
  return frame(
    component(
      'Region',
      { name: a.name, label: a.label || undefined },
      { slots: { aside: [layers], children: [note(`Layer ${a.layer.toUpperCase()}: a second switch in the aside is the same object as the views' tabs.`)] } },
    ),
  );
}
