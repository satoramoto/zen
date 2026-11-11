// What each push-setup scenario does and checks. The words are in Setup.stories.tsx. The sample
// unit is a standalone Push on the Studio network, with Upstairs (secured, not known) and Cafe
// (open) in reach, two inputs, the MIDI jacks and a USB keyboard, and three lessons.
import { initialState } from '../../model/state';
import type { PushSet } from '../../model/types';
import { CONTROLS } from '../../model/layout';
import { all, cell, click, column, columns, display, expect, given, go, hit, holding, intent, lampState, lists, overlay, paramText, press, rowTexts, screenKind, screenText, tab, turn, waitFor } from '../play';
import type { Play } from '../scenario';

const TAB = { status: 0, expression: 1, sensitivity: 2, audio: 3, midi: 4, pedals: 5, preferences: 6, software: 7 } as const;
/** The Setup menu, open on a tab. */
const on = (name: keyof typeof TAB, set?: (set: PushSet) => void) => ({ args: { initialState: { ...initialState(), display: 'setup' as const, setup: { tab: TAB[name], highlight: 0 } } }, ...(set ? { set } : {}) });
/** The last setting the app was asked for. */
const lastSetting = (context: Parameters<typeof all>[0]) => all(context, 'set-setting').at(-1);
/** One choice on: an encoder moves a choice every four steps. */
const CHOICE = 4;
/** The buttons and pads whose lamp is not off. */
const alight = (c: HTMLElement) => CONTROLS.filter((x) => x.kind === 'button' || x.kind === 'pad').filter((x) => !['off', 'none'].includes(lampState(c, x.id))).map((x) => x.id);

export const plays = {
  Opening: {
    act: async ({ canvasElement: c }) => {
      await press(c, 'setup');
    },
    check: ({ canvasElement: c }) => {
      expect(screenKind(c)).toBe('setup');
      expect(rowTexts(c, 'bottom')).toEqual(['Status', 'Expression', 'Sensitivity', 'Audio', 'MIDI', 'Pedals & CV', 'Preferences', 'Software']);
      expect(tab(c, 'bottom', 1)).toHaveAttribute('data-selected');
      expect(paramText(c, 3)).toContain('Display Light');
    },
  },

  AChangeTheAppKeeps: {
    ...on('status'),
    act: async ({ canvasElement: c }) => {
      await turn(c, 'encoder-3', -40);
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(lastSetting(context)).toMatchObject({ setting: 'display-light', value: 60 });
      await waitFor(() => expect(paramText(c, 3)).toMatch(/60\s*%/));
      // The display's own light follows the reading the app keeps.
      expect(Number(display(c).style.getPropertyValue('--push-light'))).toBeCloseTo(0.6);
    },
  },

  SwitchingToControlMode: {
    ...on('status'),
    act: async ({ canvasElement: c }) => {
      expect(rowTexts(c, 'top')[0]).toBe('Control Live');
      await press(c, 'upper-1');
    },
    check: (context) => {
      expect(intent(context, 'set-unit-mode')).toMatchObject({ mode: 'control' });
    },
  },

  Charging: {
    ...on('status', (set) => void (set.unit.battery = { percent: 38, charging: true })),
    act: async () => {},
    check: ({ canvasElement: c }) => {
      expect(screenText(c)).toContain('Battery 38%');
      expect(overlay(c, 'battery')).toHaveAccessibleName('Battery 38 percent, charging');
    },
  },

  AUnitWithoutAProcessor: {
    ...on('status', (set) => {
      set.unit.processor = false;
      set.unit.mode = 'control';
    }),
    act: async () => {},
    check: ({ canvasElement: c }) => {
      expect(screenText(c)).not.toContain('Battery');
      expect(screenText(c)).not.toContain('Storage');
      expect(overlay(c, 'battery')).toBeNull();
      expect(rowTexts(c, 'top').join(' ')).not.toMatch(/Standalone|Control Live/);
      expect(screenText(c)).toContain('Control Mode');
    },
  },

  Connecting: {
    ...on('status'),
    act: async ({ canvasElement: c }) => {
      // The Wi-Fi encoder moves to Upstairs, which wants a password this unit does not know.
      await turn(c, 'encoder-5', CHOICE);
      expect(lists(c)[0].chosen).toBe('Upstairs');
      await press(c, 'upper-6');
      expect(overlay(c, 'text-entry')).toHaveAccessibleName('Password for Upstairs');
      // A, then two to the right for C.
      await click(c, 'jog');
      await go(c, 'right', 'right');
      await click(c, 'jog');
      await press(c, 'upper-8');
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(intent(context, 'connect-wifi')).toMatchObject({ network: 'Upstairs', text: 'AC' });
      expect(overlay(c, 'text-entry')).toBeNull();
      // The app answers: Upstairs is the connected network now.
      await waitFor(() => expect(column(c, 5)!.textContent).toMatch(/Upstairs\s*Connected/));
    },
  },

  Forgetting: {
    ...on('status'),
    act: async ({ canvasElement: c }) => {
      expect(rowTexts(c, 'top')[5]).toBe('Connect');
      await holding(c, 'shift', async () => {
        expect(rowTexts(c, 'top')[5]).toBe('Forget');
        await press(c, 'upper-6');
      });
    },
    check: (context) => {
      expect(intent(context, 'forget-wifi')).toMatchObject({ network: 'Studio' });
    },
  },

  WiFiOff: {
    ...on('status', (set) => void (set.unit.wifi.on = false)),
    act: async () => {},
    check: ({ canvasElement: c }) => {
      expect(rowTexts(c, 'top')[4]).toBe('Wi-Fi: Off');
      expect(lists(c)[0].rows).toEqual([]);
      // With nothing to connect to, Connect is not offered.
      expect(rowTexts(c, 'top')[5]).toBe('');
    },
  },

  HotspotOn: {
    ...on('status', (set) => void (set.unit.hotspot = { on: true, name: 'Push-1A2B', password: 'makemusic' })),
    act: async () => {},
    check: ({ canvasElement: c }) => {
      expect(rowTexts(c, 'top')[6]).toBe('Hotspot: On');
      expect(screenText(c)).toContain('Hotspot Push-1A2B');
      expect(screenText(c)).toContain('Password makemusic');
    },
  },

  Link: {
    ...on('status', (set) => void (set.transport.link = { on: false, peers: 0 })),
    act: async ({ canvasElement: c }) => {
      expect(paramText(c, 8)).toContain('Link');
      await turn(c, 'encoder-8', CHOICE);
    },
    check: (context) => {
      expect(lastSetting(context)).toMatchObject({ setting: 'link', value: true });
    },
  },

  PolyAftertouchHidesTheMPEOptions: {
    ...on('expression', (set) => void (set.unit.expression.mode = 'poly-aftertouch')),
    act: async () => {},
    check: ({ canvasElement: c }) => {
      expect(paramText(c, 1)).toContain('Poly Aftertouch');
      expect(columns(c)).toEqual([1]);
      expect(screenText(c)).not.toMatch(/Pitch Bend|In Tune|Slide/);
    },
  },

  AWiderInTuneZone: {
    ...on('expression'),
    act: async ({ canvasElement: c }) => {
      // The sample's zone is a quarter of a pad, 7 mm.
      expect(paramText(c, 5)).toMatch(/7\s*mm/);
      await turn(c, 'encoder-5', 8);
    },
    check: async (context) => {
      expect(lastSetting(context)).toMatchObject({ setting: 'in-tune-width', value: 15, unit: 'mm' });
      await waitFor(() => expect(paramText(context.canvasElement, 5)).toMatch(/15\s*mm/));
    },
  },

  Reset: {
    ...on('sensitivity'),
    act: async ({ canvasElement: c }) => {
      expect(rowTexts(c, 'top')[7]).toBe('Reset');
      await press(c, 'upper-8');
    },
    check: (context) => {
      expect(all(context, 'reset-sensitivity')).toHaveLength(1);
    },
  },

  SeeingAPress: {
    ...on('sensitivity'),
    act: async ({ canvasElement: c }) => {
      expect(display(c).querySelector('.push-trace__marker')).toBeNull();
      await hit(c, 4, 4);
    },
    check: async ({ canvasElement: c }) => {
      await waitFor(() => expect(display(c).querySelector('.push-trace__marker')).not.toBeNull());
      // The pad still plays: the mark is beside the note, not in place of it.
      expect(display(c).querySelector('.push-trace__line')).not.toBeNull();
    },
  },

  AnInstrumentInput: {
    ...on('audio'),
    act: async ({ canvasElement: c }) => {
      expect(paramText(c, 3)).toContain('In 1 Type');
      await turn(c, 'encoder-3', CHOICE);
    },
    check: (context) => {
      expect(lastSetting(context)).toMatchObject({ setting: 'input-type', value: 'instrument', inputs: [1] });
    },
  },

  LinkedInputs: {
    ...on('audio', (set) => void (set.unit.audio.inputs[1].linked = true)),
    act: async ({ canvasElement: c }) => {
      expect(tab(c, 'top', 3)).toHaveAttribute('data-selected');
      await turn(c, 'encoder-3', CHOICE);
    },
    check: async (context) => {
      expect(lastSetting(context)).toMatchObject({ setting: 'input-type', value: 'instrument', inputs: [1, 2] });
      await waitFor(() => expect(paramText(context.canvasElement, 5)).toContain('Instrument'));
    },
  },

  AnInputMeter: {
    ...on('audio'),
    act: async ({ canvasElement: c }) => {
      cell(c, 'encoder-6').dataset.before = column(c, 6)!.querySelector('[role="slider"]')!.getAttribute('aria-valuenow') ?? '';
      await given(c, (set) => void (set.unit.audio.inputs[1].level = 0.7));
    },
    check: async ({ canvasElement: c }) => {
      const meter = () => Number(column(c, 6)!.querySelector('[role="slider"]')!.getAttribute('aria-valuenow'));
      await waitFor(() => expect(meter()).toBeCloseTo(0.7));
      expect(Number(cell(c, 'encoder-6').dataset.before)).toBeCloseTo(0.1);
      // The reading beside it is still the gain.
      expect(paramText(c, 6)).toContain('6 dB');
    },
  },

  ClockOut: {
    ...on('midi'),
    act: async ({ canvasElement: c }) => {
      expect(lists(c)[0].chosen).toBe('MIDI In/Out');
      await turn(c, 'encoder-1', CHOICE);
      expect(paramText(c, 1)).toContain('Output');
      await press(c, 'upper-3');
    },
    check: (context) => {
      expect(lastSetting(context)).toMatchObject({ setting: 'midi-port', port: 'din', side: 'output', flag: 'sync', value: true });
    },
  },

  ExternalSync: {
    ...on('midi'),
    act: async ({ canvasElement: c }) => {
      await turn(c, 'encoder-7', CHOICE);
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(paramText(c, 7)).toContain('External Sync');
      expect(column(c, 7)).toHaveAttribute('data-disabled');
      // Greyed, it asks nothing; and Sync Delay is not offered either.
      expect(all(context, 'set-setting')).toEqual([]);
      expect(screenText(c)).not.toContain('Sync Delay');
    },
  },

  EnablingCV: {
    ...on('pedals'),
    act: async ({ canvasElement: c }) => {
      expect(screenText(c)).not.toContain('CV outputs');
      await turn(c, 'encoder-1', CHOICE);
    },
    check: async (context) => {
      expect(lastSetting(context)).toMatchObject({ setting: 'jack', jack: 'Pedal 1', value: 'CV Out' });
      await waitFor(() => expect(screenText(context.canvasElement)).toContain('CV outputs 5 and 6'));
    },
  },

  ClipWorkflow: {
    ...on('preferences'),
    act: async ({ canvasElement: c }) => {
      expect(paramText(c, 1)).toContain('Workflow');
      await turn(c, 'encoder-1', CHOICE);
    },
    check: (context) => {
      expect(lastSetting(context)).toMatchObject({ setting: 'preference', preference: 'Workflow', value: 'Clip' });
    },
  },

  AnUpdateIsReady: {
    ...on('status', (set) => void (set.unit.software.update = { version: '12.4', state: 'available' })),
    act: async ({ canvasElement: c }) => {
      // The asterisk is on the tab from any other tab.
      expect(rowTexts(c, 'bottom')[7]).toBe('Software*');
      await press(c, 'lower-8');
    },
    check: ({ canvasElement: c }) => {
      expect(rowTexts(c, 'bottom')[7]).toBe('Software*');
      expect(rowTexts(c, 'top')[4]).toBe('Update');
      expect(screenText(c)).toContain('Version 12.4 is available');
    },
  },

  Updating: {
    ...on('software', (set) => void (set.unit.software.update = { version: '12.4', state: 'installing', progress: 0.4 })),
    act: async ({ canvasElement: c }) => {
      expect(overlay(c, 'progress')).toHaveAttribute('aria-valuenow', '40');
      expect(rowTexts(c, 'top')[4]).toBe('Cancel');
      await press(c, 'upper-5');
    },
    check: (context) => {
      expect(all(context, 'cancel-update')).toHaveLength(1);
    },
  },

  ResetNeedsAYes: {
    ...on('software'),
    act: async ({ canvasElement: c }) => {
      await holding(c, 'shift', async () => {
        expect(rowTexts(c, 'top').slice(0, 3)).toEqual(['Legal Info', 'Crash Info', 'Reset Push']);
        await press(c, 'upper-3');
      });
      cell(c, 'upper-3').dataset.asked = overlay(c, 'confirm') ? 'confirm' : 'none';
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(cell(c, 'upper-3').dataset.asked).toBe('confirm');
      expect(all(context, 'reset-unit')).toEqual([]);
      // Accepted, it is asked once.
      await click(c, 'jog');
      expect(all(context, 'reset-unit')).toHaveLength(1);
      expect(overlay(c, 'confirm')).toBeNull();
    },
  },

  Authorizing: {
    ...on('software'),
    act: async ({ canvasElement: c }) => {
      await press(c, 'upper-1');
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(intent(context, 'authorize')).toMatchObject({ purpose: 'authorize' });
      await waitFor(() => expect(overlay(c, 'dialog')).not.toBeNull());
      expect(overlay(c, 'dialog')!.textContent).toContain('push.local/authorize');
      expect(overlay(c, 'dialog')!.textContent).toContain('481 205');
    },
  },

  CancellingAPairing: {
    set: (set) => void (set.unit.software.code = { purpose: 'pair', code: '733190' }),
    act: async ({ canvasElement: c }) => {
      expect(overlay(c, 'dialog')!.textContent).toContain('733 190');
      await press(c, 'upper-1');
    },
    check: async (context) => {
      expect(intent(context, 'authorize')).toMatchObject({ purpose: 'pair', cancel: true });
      await waitFor(() => expect(overlay(context.canvasElement, 'dialog')).toBeNull());
    },
  },

  RunningOut: {
    set: (set) => {
      set.unit.power = 'shutting-down';
      set.unit.battery = { percent: 0, charging: false };
    },
    act: async ({ canvasElement: c }) => {
      cell(c, 'setup').dataset.said = screenText(c);
      await given(c, (set) => void (set.unit.power = 'off'));
    },
    check: async ({ canvasElement: c }) => {
      expect(cell(c, 'setup').dataset.said).toContain('Saving the Set');
      await waitFor(() => expect(screenKind(c)).toBe('blank'));
      expect(screenText(c)).toBe('');
      expect(alight(c)).toEqual([]);
    },
  },

  Booting: {
    set: (set) => {
      set.unit.power = 'starting';
      set.unit.starting = 0.3;
    },
    act: async () => {},
    check: ({ canvasElement: c }) => {
      expect(screenKind(c)).toBe('starting');
      expect(overlay(c, 'progress')).toHaveAttribute('aria-valuenow', '30');
      expect(alight(c)).toEqual([]);
    },
  },

  ALesson: {
    act: async ({ canvasElement: c }) => {
      await press(c, 'learn');
      expect(lists(c)[0].rows[0]).toBe('A tour of Push');
      await click(c, 'jog');
    },
    check: async (context) => {
      const c = context.canvasElement;
      expect(screenKind(c)).toBe('lesson');
      expect(intent(context, 'open-lesson')).toMatchObject({ lesson: 'lesson-1' });
      expect(screenText(c)).toContain('The pads play notes and launch clips.');
      expect(screenText(c)).toContain('Page 1 of 3');
      expect(rowTexts(c, 'top')[7]).toBe('Next');
      expect(tab(c, 'top', 7)).toHaveAttribute('data-dim');
      await press(c, 'upper-8');
      expect(screenText(c)).toContain('Page 2 of 3');
    },
  },

  Entering: {
    set: (set) => void (set.unit.mode = 'control'),
    act: async ({ canvasElement: c }) => {
      await press(c, 'user');
    },
    check: ({ canvasElement: c }) => {
      expect(lampState(c, 'user')).toBe('lit');
      expect(screenKind(c)).toBe('user');
      expect(screenText(c)).toBe('User Mode');
    },
  },

  CueVolume: {
    act: async ({ canvasElement: c }) => {
      // Main Out, then Phones, the Main track, and Cue.
      await click(c, 'volume');
      await click(c, 'volume');
      await click(c, 'volume');
      await turn(c, 'volume', -3);
    },
    check: (context) => {
      expect(all(context, 'set-volume-target').map((i) => i.target)).toEqual(['Phones', 'Main Track', 'Cue']);
      const turns = all(context, 'set-volume');
      expect(turns).toHaveLength(3);
      expect(turns.every((i) => i.target === 'Cue' && Number(i.db) < 0)).toBe(true);
    },
  },
} satisfies Record<string, Play>;
