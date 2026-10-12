import { ActionButton } from '../../components/core/ActionButton/ActionButton';
import { Segmented } from '../../components/core/Segmented/Segmented';
import { Toggle } from '../../components/core/Toggle/Toggle';
import { Hit, HUE, hueText, MIRROR_LABELS, MIRROR_NAMES, MIRRORS, slide, SPEED, taperSlide, TRAILS, useFx, type FxControl } from '../Effects/Effects';
import { Text } from '../../primitives/Text';
import type * as fx from '../model/fx';
import { Sheet } from '../Settings/Settings';
import { NoticeBanner } from '../Views/Views';
import { Say } from '../model/words';
import './MoreEffects.css';

/**
 * **Job.** The drawer's controls: Speed, Colour and Trails (double-click resets each), Mirror,
 * Invert, a held Punch, and everything back to normal. Each goes out as a live action, as a
 * controller's would (M, I, P, 0).
 *
 * **Changed.** Rows are type: a name, then its control, on space alone. Mirror is the core
 * `Segmented` (the visuals tabs material: words, the chosen one underlined in the accent); Invert
 * the core `Toggle` read at its row's end; Reset a quiet `ActionButton`.
 *
 * **Kept.** The grid (sliders across the top, the switches down the left, Punch beside them,
 * Reset under both; one column when narrow), every name, label, tooltip and action.
 *
 * **Tuning knobs.** `--vs-more-fx-punch`: the column Punch takes beside the switches
 * (`calc(var(--space-5) * 7)`, the original's 168px).
 */
export function MoreFx({ state, set, send }: Pick<FxControl, 'set' | 'send'> & { state: fx.Fx }) {
  return (
    <div className="vs-more-fx-body">
      <Text as="div" weight="strong" className="vs-more-fx-row vs-more-fx-speed">
        <span>Speed</span>
        {taperSlide(SPEED, state.speed, (v) => set({ kind: 'speed', speed: v }, { speed: v }), 'How fast the preset runs, ¼× to 4×')}
      </Text>
      <Text as="div" weight="strong" className="vs-more-fx-row vs-more-fx-hue">
        <span>Colour</span>
        {slide(HUE, state.hue, (v) => set({ kind: 'hue', value: v }, { hue: v }), hueText(state.hue), 'Turn the colours round the wheel')}
      </Text>
      <Text as="div" weight="strong" className="vs-more-fx-row vs-more-fx-trails">
        <span>Trails</span>
        {slide(TRAILS, state.trails, (v) => set({ kind: 'trails', value: v }, { trails: v }), state.trails.toFixed(2), 'Trails: how much of the last frames stays')}
      </Text>
      <Text as="div" weight="strong" className="vs-more-fx-row vs-more-fx-mirror">
        <span>Mirror</span>
        <Segmented
          label="mirror"
          items={MIRROR_NAMES}
          itemLabels={MIRROR_LABELS}
          index={Math.max(0, MIRRORS.indexOf(state.mirror))}
          onChange={(i) => set({ kind: 'mirror', mode: MIRRORS[i] }, { mirror: MIRRORS[i] })}
          title="Mirror the picture side to side, top to bottom, or both (M steps through)"
        />
      </Text>
      <Text as="div" weight="strong" className="vs-more-fx-row vs-more-fx-invert">
        <span>Invert</span>
        <Toggle on={state.invert} onChange={(on) => set({ kind: 'invert', on }, { invert: on })} layout="inside" label="invert" title="Flip the colours (I)">
          {state.invert ? 'on' : 'off'}
        </Toggle>
      </Text>
      <div className="vs-more-fx-hits">
        <Hit kind="punch" on={state.punch} hold label="Punch" keyName="P" send={send} />
      </div>
      <ActionButton tone="quiet" onPress={() => send({ kind: 'fx_reset' })} className="vs-more-fx-reset" title="Every effect back to normal; tempo and sensitivity stay (0)">
        Reset: {Say('fx reset').toLowerCase()}
      </ActionButton>
    </div>
  );
}

/** The drawer's body: the effects once they've been read. */
function Body() {
  const { state, set, send, notice, dismiss } = useFx();
  return (
    <>
      {state ? <MoreFx state={state} set={set} send={send} /> : !notice && <p role="status">Reading the effects…</p>}
      <NoticeBanner notice={notice} onDismiss={dismiss} />
    </>
  );
}

/**
 * **Job.** The More effects drawer (#98), one tap from live: opened with `openSheet('effects')`
 * from Views, mounted by the app. It leaves the show uncovered and the live controls usable behind
 * it, so it is a dialog but not a modal one: Tab keeps to it, while a click behind it still works.
 *
 * **Changed.** Drawn by Settings' `Sheet` on the core `Sheet` (`side="bottom"`, `modal={false}`):
 * an `overlay` layer along the bottom, centred, no scrim. It sits over the native preview, so it
 * is `Opaque` (the layer's solid, no blur), not glass.
 *
 * **Kept.** `open`/`onClose`, the name "More effects", Esc and the close button ("Close more
 * effects"), the focus handling, and the loading line.
 */
export function MoreEffects({ open, onClose }: { open: boolean; onClose(): void }) {
  if (!open) return null;
  return (
    <Sheet title="More effects" className="vs-more-fx" side="bottom" onClose={onClose}>
      <Body />
    </Sheet>
  );
}
