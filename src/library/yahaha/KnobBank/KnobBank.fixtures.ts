// KnobBank's stories as plain props: KnobBank.stories.tsx draws them as the Knobs region with
// React's or Svelte's `Tree`, and the tree snapshot draws every instance. The page data below is
// also the Stage's (Stage.fixtures.ts).
import { defineFixtures, instances } from '../../fixtures';
import { component, h, type Node } from '../../view/Tree.model';
import { KNOB_BANK_FORMS, type KnobBankRegionModelProps, type KnobItem } from './KnobBank.model';

/** The board's knob page 1 of 6, Style (Stage-Dark.dc.html). No knob here belongs to a part. */
export const styleKnobs: KnobItem[] = [
  { label: 'Dynamics', code: 'DynCtrl', value: '127', fraction: 1 },
  { label: 'Retrig rate', code: 'RtgRate', value: '1/8', fraction: 0.4 },
  { label: 'Retrigger', code: 'RtgOnOff', value: 'Off', fraction: 0 },
  { label: 'Mute A', code: 'StyMuteA', value: 'Off', fraction: 0 },
  { label: 'Mute B', code: 'StyMuteB', value: 'Off', fraction: 0 },
  { label: 'Swing', code: 'Swing', value: '0', unit: '%', fraction: 0 },
  { label: '---', code: '', value: '', fraction: 0, unused: true },
  { label: 'Tempo', code: 'Tempo', value: '104', fraction: 0.27 },
];

/** The knob pages, one header tab each. */
export const knobPages = ['Style', 'Rack', 'Pan', 'Reverb', 'Chorus', 'Delay'];

/** The board's knob page name and its old counter (KnobBank no longer draws the counter). */
export const styleKnobPage = { label: 'Style', count: '1/6' };

// The other pages, ported from the baseline Stage Playground's `stageKnobPages`
// (yahaha/src/ui/Stage/Stage.fixtures.ts). Knobs 1–4 on Rack, Pan and the effect pages are the
// four parts' own, so they carry `part`.

const level = (label: string, code: string, value: number, part?: KnobItem['part']): KnobItem => ({
  label,
  code,
  value: `${value}`,
  fraction: value / 127,
  ...(part ? { part } : {}),
});
const tempo: KnobItem = { label: 'Tempo', code: 'Tempo', value: '104', fraction: 0.27 };
const unused: KnobItem = { label: '---', code: '', value: '', fraction: 0, unused: true };

/** One effect page: the four parts' sends to it on knobs 1–4, its settings, its return on knob 8. */
const sends = (fx: string, code: string, settings: KnobItem[], ret: number): KnobItem[] => [
  level('Right 1', `R1${code}`, 40, 'r1'),
  level('Right 2', `R2${code}`, 20, 'r2'),
  level('Right 3', `R3${code}`, 0, 'r3'),
  level('Left', `L${code}`, 12, 'l'),
  ...settings,
  ...Array.from({ length: 3 - settings.length }, () => unused),
  level(`${fx} rtn`, `${code}Rtn`, ret),
];

/** Rack: the parts' volumes, Harmony and metronome volume, tempo. */
export const rackKnobs: KnobItem[] = [
  level('Right 1', 'R1Vol', 100, 'r1'),
  level('Right 2', 'R2Vol', 90, 'r2'),
  level('Right 3', 'R3Vol', 80, 'r3'),
  level('Left', 'LVol', 96, 'l'),
  level('Harmony', 'HarmVol', 70),
  level('Metronome', 'MetVol', 64),
  unused,
  tempo,
];

/** Pan: the parts' pan, the three effect returns, tempo. */
export const panKnobs: KnobItem[] = [
  { label: 'Right 1', code: 'R1Pan', value: 'C', fraction: 0.5, part: 'r1' },
  { label: 'Right 2', code: 'R2Pan', value: 'L24', fraction: 0.31, part: 'r2' },
  { label: 'Right 3', code: 'R3Pan', value: 'R24', fraction: 0.69, part: 'r3' },
  { label: 'Left', code: 'LPan', value: 'C', fraction: 0.5, part: 'l' },
  level('Reverb rtn', 'RevRtn', 64),
  level('Chorus rtn', 'ChoRtn', 64),
  level('Delay rtn', 'DlyRtn', 64),
  tempo,
];

export const reverbKnobs = sends(
  'Reverb',
  'Rev',
  [level('Time', 'RevTime', 70), level('Pre-delay', 'RevPre', 20), level('Tone', 'RevTone', 64)],
  64,
);
export const chorusKnobs = sends('Chorus', 'Cho', [level('Rate', 'ChoRate', 40), level('Depth', 'ChoDep', 60)], 64);
export const delayKnobs = sends(
  'Delay',
  'Dly',
  [level('Time', 'DlyTime', 50), level('Feedback', 'DlyFb', 30), level('Tone', 'DlyTone', 64)],
  64,
);

/** Every page's eight knobs, in `knobPages` order. */
export const knobsByPage: KnobItem[][] = [styleKnobs, rackKnobs, panKnobs, reverbKnobs, chorusKnobs, delayKnobs];

/* ---------- the stories ---------- */

/** The region's width on the board's Stage (about a 1440 × 900 Stage's); a story may set its own. */
export const KNOB_BANK_WIDTH = 552;

/** The region's width on a 1217 × 752 Stage (the At1217 story). */
export const KNOB_BANK_WIDTH_1217 = 464;

/** The Forms story: each form at about its least width at the compact scale (plus the region's plate). */
export const KNOB_BANK_FORM_WIDTHS: Record<string, number> = { labelled: 640, compact: 424 };

/** The controls, the same in both Storybooks. */
export const knobBankArgTypes = {
  knobs: { control: 'object' },
  pages: { control: 'object' },
  page: { control: { type: 'number', min: 0, max: knobPages.length - 1, step: 1 } },
  pageLabel: { control: 'text' },
  form: { control: 'inline-radio', options: KNOB_BANK_FORMS.map((f) => f.id) },
} as const;

/** Every story's base: the board's Style page, every page as a tab. */
export const knobBankBoard: KnobBankRegionModelProps = { knobs: styleKnobs, pages: knobPages, page: 0 };
const board = knobBankBoard;

export const knobBankStories = defineFixtures<KnobBankRegionModelProps>()({
  Board: { args: board },
  ReverbPage: { args: { ...board, page: 3 } },
  ReverbSends: { args: { ...board, page: 3, knobs: reverbKnobs } },
  RackPage: { args: { ...board, page: 1, knobs: rackKnobs } },
  PanPage: { args: { ...board, page: 2, knobs: panKnobs } },
  ChorusPage: { args: { ...board, page: 4, knobs: chorusKnobs } },
  FewerKnobs: { args: { ...board, knobs: styleKnobs.slice(0, 3) } },
  PageLabelOnly: { args: { ...board, pages: [], pageLabel: 'Swap R1' } },
  At1440: { args: board },
  At1217: { args: { ...board, page: 3, knobs: reverbKnobs } },
  Forms: {
    args: { ...board, page: 1, knobs: rackKnobs },
    items: KNOB_BANK_FORMS.map((f) => ({ form: f.id })),
  },
  Playground: { args: board },
});

/**
 * The Forms story as a view tree: one Knobs region per form of `knobBankStories.Forms.items`, each
 * at its form's width, in a column. The regions' callbacks are the handlers `page`, `press`, `step`
 * and `tipAction`.
 */
export const knobBankFormsSample = ({ name, area, knobs, pages, page, pageLabel }: KnobBankRegionModelProps): Node =>
  h(
    'div',
    { style: 'display: grid; gap: 24px; justify-items: start' },
    instances(knobBankStories.Forms).map(({ form }) =>
      h(
        'div',
        { style: `width: ${KNOB_BANK_FORM_WIDTHS[form ?? ''] ?? KNOB_BANK_WIDTH}px`, 'data-testid': `form-${form}` },
        component(
          'KnobBankRegion',
          { name, area, knobs, pages, page, pageLabel, form },
          { on: { onPage: 'page', onPress: 'press', onStep: 'step', tipAction: 'tipAction' } },
        ),
      ),
    ),
  );
