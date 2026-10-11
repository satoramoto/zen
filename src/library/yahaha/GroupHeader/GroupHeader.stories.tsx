import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Button } from '../../components';
import { withLibraryTheme } from '../../storybook';
import { GroupHeader } from './GroupHeader';

type Content = 'faders' | 'knobs' | 'pads' | 'none';
type End = 'legend' | 'none';
type Tab = { id: string; label: string; name?: string; tip?: string };
type SectionHue = 'intro' | 'main' | 'ending' | 'brk' | 'fill';
type LegendItem = { label: string; hue: SectionHue };

/** The story's args: GroupHeader's own props plus the stand-in children's, mapped into `children` and `end`. */
type Args = {
  title: string;
  detail?: string;
  count?: { label: string; value: string };
  level?: 2 | 3 | 4;
  id?: string;
  width?: number;
  content: Content;
  pageChosen: string;
  onchoosePage: (id: string) => void;
  layerChosen: string;
  onchooseLayer: (id: string) => void;
  bankChosen: string;
  onchooseBank: (id: string) => void;
  endContent: End;
  legendItems: LegendItem[];
};

const SECTION_LEGEND: LegendItem[] = [
  { label: 'Intro', hue: 'intro' },
  { label: 'Main', hue: 'main' },
  { label: 'Ending', hue: 'ending' },
  { label: 'Break', hue: 'brk' },
  { label: 'Fill', hue: 'fill' },
];

/** The lane's section-kind colours. */
const SECTION_COLOUR: Record<SectionHue, string> = {
  intro: 'var(--hue-3)',
  main: 'var(--hue-4)',
  ending: 'var(--hue-2)',
  brk: 'var(--hue-1)',
  fill: 'var(--accent)',
};

/** The band header's fader page tabs (the master button). */
const faderPageTabs: Tab[] = [
  { id: 'panel', label: 'Panel', tip: 'mixer.page' },
  { id: 'style', label: 'Style', tip: 'mixer.page' },
];

/** The band header's fader layer tabs. */
const layerTabs: Tab[] = [
  { id: 'volume', label: 'Vol', name: 'Volume', tip: 'mixer.layer' },
  { id: 'pan', label: 'Pan', tip: 'mixer.layer' },
  { id: 'reverb', label: 'Reverb', name: 'Reverb send', tip: 'mixer.layer' },
  { id: 'chorus', label: 'Chorus', name: 'Chorus send', tip: 'mixer.layer' },
  { id: 'delay', label: 'Delay', name: 'Delay send', tip: 'mixer.layer' },
];

const KNOB_PAGES = ['Style', 'Rack', 'Pan', 'Reverb', 'Chorus', 'Delay'];
const PAD_BANKS = ['Sections', 'Quick Racks', 'Chord', 'Multi Pads', 'Setup'];
const PAD_TIPS = ['padpage.sections', 'padpage.racks', 'padpage.chord', 'padpage.multi_pads', 'padpage.setup'];

/** Stand-in for a run of header tabs: ghost library Buttons in a tablist, the chosen one pressed. */
function StandInTabs({ label, tabs, chosen, onchoose }: { label: string; tabs: Tab[]; chosen: string; onchoose: (id: string) => void }) {
  return (
    <span role="tablist" aria-label={label} style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-1)' }}>
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant="ghost"
          role="tab"
          aria-label={tab.name}
          aria-selected={tab.id === chosen}
          aria-pressed={tab.id === chosen}
          data-tip={tab.tip}
          style={{ minHeight: 0, paddingBlock: 'var(--space-1)' }}
          onClick={() => onchoose(tab.id)}
        >
          {tab.label}
        </Button>
      ))}
    </span>
  );
}

/** Stand-in for a hue legend: a dot in each section kind's colour, then its word. */
function StandInLegend({ items }: { items: LegendItem[] }) {
  return (
    <>
      {items.map((item) => (
        <span key={item.hue} style={{ display: 'inline-flex', alignItems: 'baseline', gap: 'var(--space-1)', color: 'var(--text-2)' }}>
          <span
            aria-hidden
            style={{
              alignSelf: 'center',
              width: 'var(--space-2)',
              height: 'var(--space-2)',
              borderRadius: 'var(--radius-pill)',
              background: SECTION_COLOUR[item.hue],
            }}
          />
          {item.label}
        </span>
      ))}
    </>
  );
}

function children(args: Args) {
  if (args.content === 'none') return undefined;
  if (args.content === 'faders') {
    return (
      <>
        <StandInTabs label="Fader page (master button)" tabs={faderPageTabs} chosen={args.pageChosen} onchoose={args.onchoosePage} />
        <span aria-hidden style={{ alignSelf: 'center', width: 'var(--border-width)', height: 'var(--space-4)', background: 'var(--border)' }} />
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
          <span style={{ color: 'var(--text-3)' }}>Layer</span>
          <StandInTabs label="Fader layer" tabs={layerTabs} chosen={args.layerChosen} onchoose={args.onchooseLayer} />
        </span>
      </>
    );
  }
  const knobs = args.content === 'knobs';
  const names = knobs ? KNOB_PAGES : PAD_BANKS;
  return (
    <StandInTabs
      label={knobs ? 'Knob page' : 'Pad bank'}
      tabs={names.map((name, i) => ({ id: String(i), label: name, tip: knobs ? 'knobs.page' : PAD_TIPS[i] }))}
      chosen={args.bankChosen}
      onchoose={args.onchooseBank}
    />
  );
}

/**
 * The row that names a group of controls and holds its tabs, its hue legend at the right end
 * (`end`) and its page counter. The stories put stand-ins (ghost library Buttons as tabs, a dot
 * legend) into `children` and `end`; their args are grouped by child in the Controls panel.
 */
const meta: Meta<Args> = {
  title: 'Library/Yahaha/Primitives/GroupHeader',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <GroupHeader
      title={args.title}
      detail={args.detail}
      count={args.count}
      level={args.level}
      id={args.id}
      width={args.width}
      end={args.endContent === 'legend' ? <StandInLegend items={args.legendItems} /> : undefined}
    >
      {children(args)}
    </GroupHeader>
  ),
  args: {
    title: 'Faders',
    content: 'faders',
    pageChosen: 'panel',
    onchoosePage: fn(),
    layerChosen: 'volume',
    onchooseLayer: fn(),
    bankChosen: '0',
    onchooseBank: fn(),
    endContent: 'none',
    legendItems: SECTION_LEGEND,
  },
  argTypes: {
    title: { control: 'text' },
    detail: { control: 'text' },
    count: { control: 'object' },
    level: { control: 'inline-radio', options: [2, 3, 4] },
    id: { control: 'text' },
    width: { control: 'number' },
    content: { control: 'select', options: ['faders', 'knobs', 'pads', 'none'], table: { category: 'children' } },
    pageChosen: { control: 'select', options: ['panel', 'style'], table: { category: 'Tabs · fader page' } },
    onchoosePage: { table: { category: 'Tabs · fader page' } },
    layerChosen: {
      control: 'select',
      options: ['volume', 'pan', 'reverb', 'chorus', 'delay'],
      table: { category: 'Tabs · layer' },
    },
    onchooseLayer: { table: { category: 'Tabs · layer' } },
    bankChosen: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5'],
      table: { category: 'Tabs · knob page or pad bank' },
    },
    onchooseBank: { table: { category: 'Tabs · knob page or pad bank' } },
    endContent: { control: 'inline-radio', options: ['legend', 'none'], table: { category: 'end' } },
    legendItems: { control: 'object', table: { category: 'Legend' } },
  },
};

export default meta;
type Story = StoryObj<Args>;

/** The Faders header: title, the fader page tabs with Panel chosen, the separator, "Layer" and the layer tabs with Vol chosen. */
export const Board: Story = {
  args: { title: 'Faders', width: 646, content: 'faders' },
};

/** Knobs and the knob page tabs, Style chosen. */
export const Knobs: Story = {
  args: { title: 'Knobs', width: 666, content: 'knobs' },
};

/** Pads, the pad bank tabs with Sections chosen, and at the right end the five-hue section legend (`end`). */
export const Pads: Story = {
  args: { title: 'Pads', width: 666, content: 'pads', endContent: 'legend' },
};

/** Faders in the Reverb layer: the detail after the title, "Faders · Reverb". */
export const FadersLayer: Story = {
  args: { title: 'Faders', detail: 'Reverb', width: 646, content: 'faders', layerChosen: 'reverb' },
};

/** Knobs with the page counter at the right end, "Page 1/6". */
export const KnobsCount: Story = {
  args: { title: 'Knobs', width: 666, content: 'knobs', count: { label: 'Page', value: '1/6' } },
};

/** Pads with both the legend and the counter: the legend takes the slack, the counter follows it. */
export const PadsLegendCount: Story = {
  args: { title: 'Pads', width: 666, content: 'pads', endContent: 'legend', count: { label: 'Bank', value: '1/5' } },
};

/** The transport column's header: the title alone. */
export const Transport: Story = {
  args: { title: 'Transport', width: 88, content: 'none' },
};

/** The tempo header under the transport buttons: the title alone. */
export const Tempo: Story = {
  args: { title: 'Tempo', width: 88, content: 'none' },
};

/** A level-3 heading: the same row, the heading's level changes only the outline. */
export const Level3: Story = {
  args: { title: 'Knobs', level: 3, content: 'none', count: { label: 'Page', value: '1/6' } },
};

/** Too narrow: the detail truncates first, the tabs give way next; the title and counter stay whole. */
export const Narrow: Story = {
  args: { title: 'Faders', detail: 'Chorus send', width: 360, content: 'faders', layerChosen: 'chorus', count: { label: 'Page', value: '2/6' } },
};
