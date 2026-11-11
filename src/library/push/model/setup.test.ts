import { describe, expect, it } from 'vitest';
import { project } from './project';
import { sensitivityCurve, SETUP_TABS } from './layers/setup';
import { sampleSet } from './sample';
import { initialState } from './state';
import { hold, pad, play, release, tap, twist } from './testing';
import type { PushSet, PushState } from './types';

const TAB = Object.fromEntries(SETUP_TABS.map((name, i) => [name, i])) as Record<(typeof SETUP_TABS)[number], number>;
const inSetup = (tab: (typeof SETUP_TABS)[number], more: Partial<PushState['setup']> = {}): PushState => ({ ...initialState(), display: 'setup', setup: { tab: TAB[tab], highlight: 0, ...more } });
const unit = (change: (set: PushSet) => void): PushSet => {
  const set = sampleSet();
  change(set);
  return set;
};

describe('the Setup menu', () => {
  it.each([
    ['Status', 'encoder-3', -40, { setting: 'display-light', value: 60 }],
    ['Status', 'encoder-4', -25, { setting: 'led-brightness', value: 75 }],
    ['Expression', 'encoder-1', 4, { setting: 'expression-mode', value: 'poly-aftertouch' }],
    ['Expression', 'encoder-3', 4, { setting: 'note-pitch-bend', value: 'on' }],
    ['Expression', 'encoder-4', -4, { setting: 'in-tune-location', value: 'finger' }],
    ['Expression', 'encoder-5', 8, { setting: 'in-tune-width', value: 15, unit: 'mm' }],
    ['Expression', 'encoder-6', -3, { setting: 'slide-height', value: 13, unit: 'mm' }],
    ['Sensitivity', 'encoder-3', 10, { setting: 'sensitivity-threshold', value: 0.3 }],
    ['Sensitivity', 'encoder-6', -25, { setting: 'sensitivity-range', value: 0.75 }],
    ['Audio', 'encoder-1', 4, { setting: 'sample-rate', value: '88200' }],
    ['Audio', 'encoder-2', 4, { setting: 'buffer-size', value: '256' }],
    ['Audio', 'encoder-3', 4, { setting: 'input-type', value: 'instrument', inputs: [1] }],
    ['Audio', 'encoder-4', 5, { setting: 'input-gain', value: 11, inputs: [1], unit: 'dB' }],
    ['Audio', 'encoder-5', 8, { setting: 'input-type', value: 'high', inputs: [2] }],
    ['Audio', 'encoder-7', 4, { setting: 'output-source', value: 'Cue', output: 'Out 1/2' }],
    ['Audio', 'encoder-8', 4, { setting: 'clock-source', value: 'ADAT In' }],
    ['Pedals & CV', 'encoder-1', 4, { setting: 'jack', jack: 'Pedal 1', value: 'CV Out' }],
    ['Pedals & CV', 'encoder-5', 4, { setting: 'jack', jack: 'Pedal 2', value: 'CV Out' }],
    ['Preferences', 'encoder-1', 4, { setting: 'preference', preference: 'Workflow', value: 'Clip' }],
    ['Preferences', 'encoder-3', 4, { setting: 'preference', preference: 'Exclusive Arm', value: 'Off' }],
    ['Preferences', 'encoder-6', 4, { setting: 'preference', preference: 'Select on Launch', value: 'Off' }],
  ] as const)('%s: turning %s by %i asks for a setting', (tab, encoder, steps, asked) => {
    const { intents } = play([twist(encoder, steps)], { state: inSetup(tab), host: false });
    expect(intents).toEqual([{ kind: 'setting', action: 'set-setting', ...asked }]);
  });

  it.each([
    ['Status', 'upper-1', { action: 'set-unit-mode', mode: 'control' }],
    ['Status', 'upper-5', { action: 'set-setting', setting: 'wifi', value: false }],
    ['Status', 'upper-6', { action: 'connect-wifi', network: 'Studio' }],
    ['Status', 'upper-7', { action: 'set-setting', setting: 'hotspot', value: true }],
    ['Status', 'upper-8', { action: 'set-setting', setting: 'play-sync' }],
    ['Sensitivity', 'upper-8', { action: 'reset-sensitivity' }],
    ['Audio', 'upper-3', { action: 'set-setting', setting: 'link-inputs', value: true }],
    ['MIDI', 'upper-2', { action: 'set-setting', setting: 'midi-port', port: 'din', side: 'input', flag: 'track', value: false }],
    ['MIDI', 'upper-3', { action: 'set-setting', setting: 'midi-port', port: 'din', side: 'input', flag: 'sync', value: true }],
    ['MIDI', 'upper-4', { action: 'set-setting', setting: 'midi-port', port: 'din', side: 'input', flag: 'remote', value: true }],
    ['Software', 'upper-1', { action: 'authorize', purpose: 'authorize' }],
    ['Software', 'upper-2', { action: 'set-setting', setting: 'usage-data', value: true }],
  ] as const)('%s: pressing %s asks', (tab, button, asked) => {
    const { intents } = play(tap(button), { state: inSetup(tab), host: false });
    expect(intents).toHaveLength(1);
    expect(intents[0]).toMatchObject(asked);
  });

  it('holds no setting of its own: the answer is read back from the Set', () => {
    const turned = play([twist('encoder-3', -40)], { state: inSetup('Status') });
    expect(turned.set.unit.displayLight).toBe(60);
    expect(turned.state.setup).toEqual({ tab: 0, highlight: 0 });
    const body = project(turned.state, turned.set).screen.body;
    expect(body.find((c) => c.type === 'param' && c.col === 3)).toMatchObject({ value: '60 %', fraction: 0.6 });
    // Unanswered, the reading stays where the app left it.
    const unanswered = play([twist('encoder-3', -40)], { state: inSetup('Status'), host: false });
    expect(project(unanswered.state, unanswered.set).screen.body.find((c) => c.type === 'param' && c.col === 3)).toMatchObject({ value: '100 %' });
  });

  it('the lower buttons choose a tab; Setup leaves for the screen before', () => {
    const opened = play([...tap('mix'), ...tap('setup')]);
    expect(opened.state.display).toBe('setup');
    expect(project(opened.state, opened.set).screen.bottom.map((c) => c?.label)).toEqual([...SETUP_TABS]);
    const moved = play(tap('lower-4'), { state: opened.state });
    expect(moved.state.setup.tab).toBe(3);
    expect(play(tap('setup'), { state: moved.state }).state.display).toBe('mix');
  });

  it('a level stops at its ends and a choice at its last word', () => {
    expect(play([twist('encoder-3', 5)], { state: inSetup('Status'), host: false }).intents).toEqual([]);
    expect(play([twist('encoder-6', 9)], { state: inSetup('Expression'), host: false }).intents).toEqual([]);
    expect(play([twist('encoder-1', -4)], { state: inSetup('Preferences'), host: false }).intents).toEqual([]);
    // Fewer than four steps is not yet a choice.
    expect(play([twist('encoder-1', 3)], { state: inSetup('Preferences'), host: false }).intents).toEqual([]);
  });

  it('Wi-Fi: a known or open network connects at once, an unknown secured one asks for its password', () => {
    const open = play([twist('encoder-5', 8), ...tap('upper-6')], { state: inSetup('Status'), host: false });
    expect(open.intents).toEqual([{ kind: 'setting', action: 'connect-wifi', network: 'Cafe' }]);
    const secured = play([twist('encoder-5', 4), ...tap('upper-6')], { state: inSetup('Status'), host: false });
    expect(secured.intents).toEqual([]);
    expect(secured.state.textEntry).toMatchObject({ title: 'Password for Upstairs', text: '' });
    const typed = play([...tap('jog'), ...tap('upper-8')], { state: secured.state });
    expect(typed.intents).toEqual([{ kind: 'setting', action: 'connect-wifi', network: 'Upstairs', text: 'A' }]);
    expect(typed.set.unit.wifi.networks.filter((n) => n.connected).map((n) => n.name)).toEqual(['Upstairs']);
    // Shift turns Connect into Forget, for the connected network whatever is highlighted.
    const forgot = play([twist('encoder-5', 4), hold('shift'), ...tap('upper-6'), release('shift')], { state: inSetup('Status') });
    expect(forgot.intents).toEqual([{ kind: 'setting', action: 'forget-wifi', network: 'Studio' }]);
    expect(forgot.set.unit.wifi.networks[0]).toMatchObject({ connected: false, known: false });
  });

  it('a unit with no processor has no mode to switch, and Wi-Fi off lists nothing', () => {
    const controller = unit((s) => void Object.assign(s.unit, { processor: false, mode: 'control' }));
    expect(play(tap('upper-1'), { set: controller, state: inSetup('Status'), host: false }).intents).toEqual([]);
    const screen = project(inSetup('Status'), controller).screen;
    expect(screen.overlays).toEqual([]);
    expect(JSON.stringify(screen.body)).not.toMatch(/Battery|Storage/);
    const off = unit((s) => void (s.unit.wifi.on = false));
    expect(project(inSetup('Status'), off).screen.body.find((c) => c.type === 'list')).toMatchObject({ items: [] });
    expect(play(tap('upper-6'), { set: off, state: inSetup('Status'), host: false }).intents).toEqual([]);
  });

  it('Expression offers bend and slide in MPE only', () => {
    const names = (set: PushSet) => project(inSetup('Expression'), set).screen.body.map((c) => (c.type === 'param' ? c.name : ''));
    expect(names(sampleSet())).toEqual(['Expression Mode', 'Note Pitch Bend', 'In Tune Location', 'In Tune Width', 'Slide Height']);
    expect(names(unit((s) => void (s.unit.expression.mode = 'poly-aftertouch')))).toEqual(['Expression Mode']);
    expect(names(unit((s) => void (s.unit.expression.mode = 'mono-aftertouch')))).toEqual(['Expression Mode']);
    // A slide height under 13 mm is the half range the pads read.
    expect(play([twist('encoder-6', -6)], { state: inSetup('Expression') }).set.unit.expression).toMatchObject({ slideHeight: 10, slideRange: 'half' });
  });

  it('Sensitivity draws the curve the pads use and marks the last press on it', () => {
    const set = sampleSet();
    const curve = sensitivityCurve(set.unit.sensitivity);
    expect(curve).toHaveLength(33);
    expect(curve.every(([, y], i) => i === 0 || y >= curve[i - 1][1])).toBe(true);
    expect(curve.at(-1)![1]).toBeCloseTo(set.unit.sensitivity.range);
    const trace = (state: PushState) => project(state, set).screen.body.find((c) => c.type === 'trace');
    expect(JSON.stringify(trace(inSetup('Sensitivity')))).not.toContain('markers');
    const pressed = play([pad(4, 4, 'down', { velocity: 64 }), pad(4, 4, 'up')], { state: inSetup('Sensitivity'), host: false });
    expect(pressed.state.setup.press).toBeCloseTo(0.5);
    expect(JSON.stringify(trace(pressed.state))).toContain('"kind":"playhead"');
    // The pad still does its own job (here, on the drum track, a step).
    expect(pressed.actions.length).toBeGreaterThan(0);
    // On another tab a press is only a note.
    expect(play([pad(4, 4)], { state: inSetup('Audio'), host: false }).state.setup.press).toBeUndefined();
    expect(play(tap('upper-8'), { set: unit((s) => void (s.unit.sensitivity.drive = 0.9)), state: inSetup('Sensitivity') }).set.unit.sensitivity).toMatchObject({ threshold: 0.2, drive: 0.5, compand: 0.5, range: 1 });
  });

  it('Audio: linked inputs change together', () => {
    const linked = unit((s) => void (s.unit.audio.inputs[1].linked = true));
    const { intents, set } = play([twist('encoder-3', 4), twist('encoder-4', 2)], { set: linked, state: inSetup('Audio') });
    expect(intents.map((i) => i.inputs)).toEqual([[1, 2], [1, 2]]);
    expect(set.unit.audio.inputs.map((i) => [i.type, Math.round(i.gain * 20)])).toEqual([['instrument', 8], ['instrument', 8]]);
  });

  it('MIDI: the direction encoder picks a side the port has; External Sync needs an input that follows clock', () => {
    const out = play([twist('encoder-1', 4), ...tap('upper-3')], { state: inSetup('MIDI'), host: false });
    expect(out.intents).toEqual([{ kind: 'setting', action: 'set-setting', setting: 'midi-port', value: true, port: 'din', side: 'output', flag: 'sync' }]);
    // The USB keyboard has no output: it stays on Input.
    const usb = play([twist('encoder-2', 4), twist('encoder-1', 4), ...tap('upper-4')], { state: inSetup('MIDI'), host: false });
    expect(usb.intents[0]).toMatchObject({ port: 'usb', side: 'input', flag: 'remote', value: false });
    expect(play([twist('encoder-7', 4)], { state: inSetup('MIDI'), host: false }).intents).toEqual([]);
    const synced = unit((s) => void (s.unit.midi.ports[0].input!.sync = true));
    expect(play([twist('encoder-7', 4)], { set: synced, state: inSetup('MIDI'), host: false }).intents[0]).toMatchObject({ setting: 'external-sync', value: true });
    expect(play([twist('encoder-6', 12)], { set: synced, state: inSetup('MIDI'), host: false }).intents[0]).toMatchObject({ setting: 'sync-delay', value: 12, unit: 'ms' });
  });

  it('Software: an update, its progress, and the Shift options', () => {
    const ready = unit((s) => void (s.unit.software.update = { version: '12.4', state: 'available' }));
    expect(project(inSetup('Status'), ready).screen.bottom[7]?.label).toBe('Software*');
    expect(play(tap('upper-5'), { set: ready, state: inSetup('Software'), host: false }).intents).toEqual([{ kind: 'setting', action: 'update-software', version: '12.4' }]);
    const busy = unit((s) => void (s.unit.software.update = { version: '12.4', state: 'installing', progress: 0.4 }));
    expect(project(inSetup('Software'), busy).screen.overlays).toEqual([{ type: 'progress', label: 'Installing version 12.4', fraction: 0.4 }]);
    expect(play(tap('upper-5'), { set: busy, state: inSetup('Software'), host: false }).actions).toEqual(['cancel-update']);
    // A beta always sends usage data: the switch is not there.
    expect(play(tap('upper-2'), { set: unit((s) => void (s.unit.software.beta = true)), state: inSetup('Software'), host: false }).intents).toEqual([]);
    const reset = play([hold('shift'), ...tap('upper-3'), release('shift')], { state: inSetup('Software'), host: false });
    expect(reset.intents).toEqual([]);
    expect(reset.state.confirm?.text).toContain('Reset Push');
    expect(play(tap('upper-1'), { state: reset.state, host: false }).intents).toEqual([]);
    expect(play(tap('jog'), { state: reset.state, host: false }).actions).toEqual(['reset-unit']);
    const legal = play([hold('shift'), ...tap('upper-1'), release('shift')], { state: inSetup('Software'), host: false });
    expect(project(legal.state, sampleSet()).screen.overlays).toEqual([{ type: 'dialog', title: 'Legal Info', address: 'ableton.com/legal', image: true }]);
    expect(play(tap('upper-1'), { state: legal.state, host: false }).state.setup.info).toBeUndefined();
  });
});

describe('codes, power and Learn', () => {
  it('a code is shown until the app clears it or the person cancels', () => {
    const asked = play(tap('upper-1'), { state: inSetup('Software') });
    expect(asked.set.unit.software.code).toMatchObject({ purpose: 'authorize', address: 'push.local/authorize' });
    expect(project(asked.state, asked.set).screen).toMatchObject({ kind: 'dialog', overlays: [{ code: '481 205', address: 'push.local/authorize' }] });
    const cancelled = play(tap('upper-1'), { set: asked.set, state: asked.state });
    expect(cancelled.intents).toEqual([{ kind: 'setting', action: 'authorize', purpose: 'authorize', cancel: true }]);
    expect(cancelled.set.unit.software.code).toBeUndefined();
  });

  it.each([
    ['off', 'blank'],
    ['starting', 'starting'],
    ['shutting-down', 'shutting-down'],
    ['low-battery', 'low-battery'],
  ] as const)('a unit that is %s shows the %s screen with every lamp dark', (power, kind) => {
    const set = unit((s) => void (s.unit.power = power));
    const shown = project(initialState(), set);
    expect(shown.screen.kind).toBe(kind);
    expect(Object.values(shown.lamps).every((l) => l.state === 'off')).toBe(true);
    // Nothing on the face asks anything, but the power button of a unit that is off.
    expect(play([...tap('play'), ...tap('setup'), pad(1, 1)], { set, host: false }).intents).toEqual([]);
    expect(play(tap('power'), { set, host: false }).actions).toEqual(power === 'off' ? ['power'] : []);
  });

  it('onboarding is paged by the app: Next asks for the next step, and Done on the last', () => {
    const first = unit((s) => void Object.assign(s.unit, { power: 'starting', onboarding: { steps: ['One', 'Two'], step: 0 } }));
    expect(project(initialState(), first).screen).toMatchObject({ kind: 'onboarding', top: [null, null, null, null, null, null, { label: 'Back' }, { label: 'Next' }] });
    expect(play([...tap('upper-7'), ...tap('upper-8')], { set: first, host: false }).intents).toEqual([{ kind: 'setting', action: 'onboarding', step: 1 }]);
    const last = unit((s) => void Object.assign(s.unit, { power: 'starting', onboarding: { steps: ['One', 'Two'], step: 1 } }));
    expect(play([...tap('upper-7'), ...tap('upper-8')], { set: last, host: false }).intents).toEqual([
      { kind: 'setting', action: 'onboarding', step: 0 },
      { kind: 'setting', action: 'onboarding', done: true },
    ]);
  });

  it('settings are set out as the unit has them: choices from the current one, pictures in place of dials, switches as boxes', () => {
    const body = (tab: Parameters<typeof inSetup>[0], set = sampleSet()) => project(inSetup(tab), set).screen.body;
    const at = (cells: ReturnType<typeof body>, col: number) => cells.find((c) => c.col === col);
    const mpe = sampleSet();
    mpe.unit.expression.mode = 'mpe';
    mpe.unit.expression.inTune = 'finger';
    expect(at(body('Expression', mpe), 1)).toMatchObject({ name: 'Expression Mode', layout: 'stack', span: 2 });
    expect(at(body('Expression', mpe), 3)).toMatchObject({ name: 'Note Pitch Bend', layout: 'list' });
    expect([4, 5, 6].map((col) => (at(body('Expression', mpe), col) as { picture?: string }).picture)).toEqual(['finger', 'width', 'height']);
    expect(at(body('MIDI'), 1)).toMatchObject({ name: 'I/O', value: 'Input', picture: 'input' });
    expect(at(body('MIDI'), 2)).toMatchObject({ name: 'Port', layout: 'stack', span: 4, value: 'MIDI In/Out' });
    expect(at(body('MIDI'), 7)).toMatchObject({ name: 'External Sync', picture: 'off', disabled: true });
    // Pedals & CV: each jack takes half the display. Preferences: the unit's four columns.
    expect(body('Pedals & CV').filter((c) => c.type === 'param').map((c) => [c.col, (c as { name: string }).name])).toEqual([[1, 'Pedal & CV 1'], [5, 'Pedal & CV 2']]);
    expect(body('Preferences').map((c) => [c.col, (c as { name: string }).name, (c as { picture?: string }).picture])).toEqual([[1, 'Workflow', 'scene'], [3, 'Exclusive Arm', 'on'], [4, 'Exclusive Solo', 'on'], [6, 'Select on Launch', 'on']]);
    expect(project(inSetup('MIDI'), sampleSet()).screen.top.slice(1, 5)).toMatchObject([{ label: 'Track', icon: 'switch-on' }, { label: 'Sync', icon: 'switch-off', dim: true }, { label: 'Remote', icon: 'switch-off' }, { label: 'MPE', icon: 'switch-off' }]);
  });

  it('Learn lists the lessons, opens one and pages it within its ends', () => {
    const list = play(tap('learn'));
    expect(list.state.display).toBe('learn');
    const opened = play([...tap('dpad-down'), ...tap('dpad-up'), ...tap('jog')], { state: list.state, host: false });
    expect(opened.intents).toEqual([{ kind: 'navigate', action: 'open-lesson', lesson: 'lesson-1' }]);
    const text = (state: PushState) => JSON.stringify([project(state, sampleSet()).screen.top, project(state, sampleSet()).screen.body]);
    expect(text(opened.state)).toContain('Page 1 of 3');
    // Further material: the link as a code, and in text beside it.
    expect(project(opened.state, sampleSet()).screen.body).toContainEqual({ type: 'code', col: 6, text: 'https://www.ableton.com/learn-push', label: 'Code for more about A tour of Push' });
    expect(text(opened.state)).toContain('More at https://www.ableton.com/learn-push');
    // A lesson with no link has neither.
    const plain = project({ ...opened.state, learn: { highlight: 2, lesson: 'lesson-3', step: 0 } }, sampleSet()).screen.body;
    expect(plain.some((cell) => cell.type === 'code')).toBe(false);
    const paged = play([...tap('upper-7'), ...tap('upper-8'), ...tap('upper-8'), ...tap('upper-8')], { state: opened.state, host: false });
    expect(paged.state.learn.step).toBe(2);
    expect(text(paged.state)).toContain('The encoders turn without end.');
    // The X goes back to the list, and again out of Learn.
    const back = play(tap('upper-1'), { state: paged.state, host: false });
    expect(back.state.learn.lesson).toBeUndefined();
    expect(back.state.display).toBe('learn');
  });

  it('the Volume encoder steps through what the Set offers', () => {
    const { intents, set } = play([...tap('volume'), ...tap('volume'), ...tap('volume'), twist('volume', -2), ...tap('volume')]);
    expect(intents.filter((i) => i.action === 'set-volume-target').map((i) => i.target)).toEqual(['Phones', 'Main Track', 'Cue', 'Main Out']);
    expect(intents.find((i) => i.action === 'set-volume')).toMatchObject({ target: 'Cue', db: -2 });
    expect(set.unit.volumeTarget).toBe('Main Out');
    const two = unit((s) => void (s.unit.volumeTargets = ['Main Out', 'Cue']));
    expect(play([...tap('volume'), ...tap('volume')], { set: two }).intents.map((i) => i.target)).toEqual(['Cue', 'Main Out']);
  });
});
