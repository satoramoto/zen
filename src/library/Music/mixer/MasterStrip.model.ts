import { component, h, type Child, type Handlers, type Node } from '../../view/Tree.model';
import { knobStackTree } from './KnobStack.model';
import type { MixerViewProps } from './model';

export type MasterStripProps = MixerViewProps;
const slots = ['A', 'B'] as const;
const bands = ['High', 'Mid', 'Low'] as const;
const effectParamKey = (slot: string, effect: string, control: string) => `effectParam:${slot}:${effect}:${control}`;

// The source icons, as trees: models never reach through a React renderer for SVG.
function powerIcon(): Node {
  return h('svg', { viewBox: '0 0 20 20', width: '14', height: '14', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'aria-hidden': 'true' },
    h('path', { d: 'M10 2v8M6 4.5a7 7 0 1 0 8 0' }));
}

function phonesIcon(): Node {
  return h('svg', { viewBox: '0 0 20 20', width: '16', height: '16', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'aria-hidden': 'true' },
    h('path', { d: 'M3 12V9a7 7 0 0 1 14 0v3' }),
    h('rect', { x: '2', y: '10', width: '4', height: '7', rx: '1' }),
    h('rect', { x: '14', y: '10', width: '4', height: '7', rx: '1' }));
}

/** The original master face. All music state and decisions remain with the host. */
export function masterStripView({ state, commands, params, externalTransport }: MasterStripProps): Node {
  const { running, beat, bpm, cross, masterTrim, masterFilter, masterSendA, masterSendB, masterEq } = state;
  const { level: LEVEL, trim: TRIM, send: SEND, eq: EQ, filter: FILTER, tempo: TEMPO, cross: CROSS } = params;
  return h('div', { class: 'play-master-strip', 'aria-label': 'Master mixer' },
    h('div', { class: 'play-actions' },
      !externalTransport && [
        h('div', { class: 'play-run-stop' },
          component('MusicToggle', {
            disabled: state.playbackAvailable === false,
            title: state.playbackAvailable === false ? 'Four-deck playback is not connected yet' : undefined,
            on: running, width: 62,
          }, { on: { onChange: 'setRunning' }, slots: { children: [running ? 'Ⅱ Pause' : '▶ Run'] } }),
          component('MusicButton', { width: 62 }, { on: { onPress: 'stopAll' }, slots: { children: ['■ Stop'] } })),
        h('div', { class: 'play-timing', role: 'group', 'aria-label': 'Tempo' },
          component('MusicNumberField', {
            name: '', label: 'BPM', showFill: false, width: 62, title: 'Tempo in BPM', param: TEMPO, value: bpm,
            hint: 'The tempo the whole rig runs at. Only decks with Sync on follow it; the rest play at the speed they were recorded.',
          }, { on: { onChange: 'bpm' } })),
      ],
      h('div', { class: 'play-fx-pickers' }, slots.map((slot): (Child | null)[] => {
        const selected = slot === 'A' ? state.fxA : state.fxB;
        const effect = state.effects.find(e => e.id === selected);
        return [h('div', { class: 'play-fx-unit', role: 'group', 'aria-label': `FX ${slot}` },
          h('div', { class: 'play-fx-heading' },
            commands.setEffectEnabled && component('MusicButtonFace', {
              size: 'medium', 'aria-label': `FX ${slot} enabled`, title: `Enable / bypass FX ${slot}`,
              'aria-pressed': state.effectEnabled?.[slot] !== false,
            }, { on: { onClick: `effectEnabled:${slot}` }, slots: { children: [powerIcon()] } }),
            component('MusicSelect', {
              label: `FX ${slot} effect`, items: state.effects.map(e => `${slot} · ${e.name}`),
              index: state.effects.findIndex(e => e.id === selected), width: 100,
              hint: `Which effect the ${slot} send feeds. Every deck shares it, and its send knob decides how much each one hears.`,
            }, { on: { onChange: `effect:${slot}` } })),
          h('div', { class: 'play-fx-params' },
            effect?.controls?.map(control => component('MusicKnob', {
              name: control.name, label: `FX ${slot} ${effect.name} ${control.name}`, param: control.param,
              value: state.effectValues?.[slot]?.[effect.id]?.[control.id] ?? control.param.defaultValue,
              disabled: !commands.setEffectParam,
              hint: `${control.name} on the ${effect.name} in send ${slot}. What it does depends on the effect chosen above it.`,
            }, { key: `${effect.id}-${control.id}`, on: { onChange: effectParamKey(slot, effect.id, control.id) } })),
            commands.setEffectHighPass && state.effectHighPassParam && component('MusicKnob', {
              className: 'play-fx-highpass', name: 'HP', label: `FX ${slot} high pass cutoff`, param: state.effectHighPassParam,
              value: state.effectHighPass?.[slot] ?? 0, title: state.effectHighPassHint, hint: state.effectHighPassHint,
            }, { on: { onChange: `highPass:${slot}` } }))),
          slot === 'A' ? component('MusicSeparator') : null];
      })),
      !externalTransport && h('span', { class: 'play-clock' }, String(Math.floor(beat / 4) + 1).padStart(3, '0'), h('b', {}, `.${beat % 4 + 1}`))),
    component('MusicMixerSection', { className: 'play-effects' }, { slots: { children: [
      component('MusicKnob', {
        ink: 'var(--amber)', name: 'FX A', label: 'Master effects send A', param: SEND, value: masterSendA,
        hint: 'How much of the whole mix reaches the FX A effect, on top of whatever the decks are sending.',
      }, { on: { onChange: 'masterSendA' } }),
      component('MusicKnob', {
        ink: 'var(--amber)', name: 'Filter', label: 'Master filter', param: FILTER, value: masterFilter,
        hint: 'Sweeps a filter across everything at once. Left takes the top off, right takes the bottom out, and the middle is untouched.',
      }, { on: { onChange: 'masterFilter' } }),
      component('MusicKnob', {
        ink: 'var(--amber)', name: 'FX B', label: 'Master effects send B', param: SEND, value: masterSendB,
        hint: 'How much of the whole mix reaches the FX B effect, on top of whatever the decks are sending.',
      }, { on: { onChange: 'masterSendB' } }),
    ] } }),
    component('MusicMixerSection', { className: 'play-channel play-master-channel' }, { slots: { children: [
      h('div', { class: 'play-level-stack' },
        h('div', { class: 'play-channel-fader play-master-stereo', role: 'group', 'aria-label': 'Master stereo output' },
          (['Left', 'Right'] as const).map(name => ({ ...h('div', {},
            component('MusicFrameMeter', { label: `Master ${name.toLowerCase()} output` }, { on: { sample: `meter:${name}` } }),
            h('span', {}, name === 'Left' ? 'L' : 'R')), key: name })))),
      knobStackTree([
        component('MusicKnob', {
          className: 'play-trim', ink: 'var(--amber)', name: 'Trim', label: 'Master trim', param: TRIM, origin: 'center', value: masterTrim,
          hint: 'Lifts or cuts the whole mix at the master output, from −24 to +12 dB.',
        }, { on: { onChange: 'masterTrim' } }),
        ...bands.map((name, i) => component('MusicKnob', {
          name, label: `Master ${name}`, param: EQ, origin: 'center', value: masterEq[i],
          hint: `Lifts or cuts the ${name.toLowerCase()} band across everything. It rests at 0 dB, and cuts much further than it lifts.`,
        }, { key: name, on: { onChange: `eq:${i}` } })),
      ]),
    ] } }),
    h('div', { class: 'play-master-cross' },
      h('div', { class: 'play-routing-section' },
        component('MusicSeparator'),
        h('div', { class: 'play-monitor-row' },
          commands.setEffectsEnabled && h('div', { class: 'play-fx-global' },
            component('MusicContextControls', {
              label: 'Effects group', pressed: state.effectsEnabled !== false,
              title: `${state.effectsEnabled !== false ? 'FX sends enabled' : state.effectTailing ? 'FX bypassed · tails decaying' : 'FX bypassed'} · click to toggle; right-click, Shift-click or Shift+F10 for tail controls`,
            }, { on: { onPress: 'effectsEnabled' }, slots: {
              face: [powerIcon(), h('span', {}, 'FX'), state.effectTailing ? h('span', { class: 'play-tail-dot' }) : null],
              children: [
                h('p', {}, 'Bypass stops new sends and lets existing tails decay.'),
                component('MusicButtonFace', { size: 'medium', disabled: state.effectsEnabled !== false }, {
                  on: { onClick: 'clearEffectTails' }, slots: { children: ['Clear tails'] },
                }),
              ],
            } })),
          commands.setPhones && component('MusicContextControls', {
            label: 'Headphone monitoring', title: 'Headphone level and Cue / Master blend',
          }, { slots: {
            face: [phonesIcon()],
            children: [
              h('div', { class: 'play-phones-controls' },
                component('MusicKnob', { name: 'Level', label: 'Headphone level', param: LEVEL, value: state.phonesLevel ?? 100 }, { on: { onChange: 'phonesLevel' } }),
                component('MusicKnob', { name: 'Cue / Master', label: 'Headphone Cue Master blend', param: SEND, value: state.phonesMix ?? 0 }, { on: { onChange: 'phonesMix' } })),
              h('p', {}, 'Cue is before deck faders and FX returns. Master follows the master output. Both share the same clock.'),
            ],
          } })),
        component('MusicSeparator')),
      h('div', { class: 'play-crossfader-row' },
        component('MusicSlider', {
          name: '', label: 'Crossfader', showValue: false, param: CROSS, value: cross, orientation: 'horizontal', length: 'auto',
          display: cross === 0 ? 'Center' : `${Math.abs(cross)} ${cross < 0 ? 'A' : 'B'}`,
          hint: 'Fades between the decks assigned to A and the decks assigned to B. In the middle both are heard, and a deck set to Thru ignores it.',
        }, { on: { onChange: 'cross' } }))));
}

/** Handler keys carry every callback, including readFrame's stereo samplers. */
export function masterStripHandlers({ state, commands, readFrame }: MasterStripProps): Handlers {
  const handlers: Handlers = {
    setRunning: commands.setRunning,
    stopAll: commands.stopAll,
    effectsEnabled: () => commands.setEffectsEnabled?.(state.effectsEnabled === false),
    clearEffectTails: () => commands.clearEffectTails?.(),
    phonesLevel: (value: number) => commands.setPhones?.('phonesLevel', value),
    phonesMix: (value: number) => commands.setPhones?.('phonesMix', value),
    'meter:Left': () => readFrame().masterStereo?.[0] ?? 0,
    'meter:Right': () => readFrame().masterStereo?.[1] ?? 0,
  };
  for (const control of ['bpm', 'cross', 'masterTrim', 'masterFilter', 'masterSendA', 'masterSendB'] as const) {
    handlers[control] = (value: number) => commands.setMaster(control, value);
  }
  bands.forEach((_, i) => { handlers[`eq:${i}`] = (value: number) => commands.setMasterEq(i, value); });
  for (const slot of slots) {
    handlers[`effect:${slot}`] = (i: number) => commands.setEffect(slot, state.effects[i].id);
    handlers[`effectEnabled:${slot}`] = () => commands.setEffectEnabled?.(slot, state.effectEnabled?.[slot] === false);
    handlers[`highPass:${slot}`] = (value: number) => commands.setEffectHighPass?.(slot, value);
    const effect = state.effects.find(e => e.id === (slot === 'A' ? state.fxA : state.fxB));
    if (effect) for (const control of effect.controls ?? []) {
      handlers[effectParamKey(slot, effect.id, control.id)] = (value: number) => commands.setEffectParam?.(slot, effect.id, control.id, value);
    }
  }
  return handlers;
}
