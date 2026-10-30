import { useForm } from '../../../layout/assembly';
import { Text } from '../../../primitives/Text';
import { Surface } from '../../../primitives/Surface';
import type { LiveCellState, LiveTrack } from '../../../components/music/live.model';
import { arc } from '../../geometry';
import { PUSH_TWIN_FORMS, type PushTwinForm } from './PushTwin.forms';
import './PushTwin.css';

export const PUSH_ROWS = ['clips', 'clips', 'clips', 'clips', 'clips', 'stop', 'sections', 'transitions'] as const;
export type PushRow = (typeof PUSH_ROWS)[number];

export interface PushPadRef {
  row: PushRow;
  /** 0–7, left to right. */
  column: number;
  /** For a clip pad, its slot (0–4, top to bottom). */
  slot?: number;
}

export interface PushTwinProps {
  /** Draw this form, outside an assembled screen (a screen's own choice wins inside one). */
  form?: PushTwinForm;
  /** The eight columns: their clip cells fill rows 1–5, their levels the encoders. */
  tracks: readonly LiveTrack[];
  /** Row 7's eight sections, and which one plays. */
  sections: readonly string[];
  section: number;
  /** A section queued to come in on the phrase (blinks). */
  queuedSection?: number;
  /** Row 8's eight transitions, and one held down, if any. */
  transitions: readonly string[];
  held?: string;
  /** The scene buttons right of the grid, and the scene playing. */
  scenes: readonly string[];
  scene?: number;
  /** The selected column: its encoder and its stop are marked. */
  selected?: string;
  onPad?: (pad: PushPadRef) => void;
  onScene?: (index: number) => void;
  className?: string;
}

const CLIP_ROWS = 5;
const BAND: Record<PushRow, string> = { clips: 'Clips', stop: 'Stop', sections: 'Sections', transitions: 'Transitions' };

/**
 * **Job.** The controller under the player's hands, on screen: what every pad is lit as right
 * now, so the screen and the hardware never disagree — and a way to play it with a mouse when the
 * Push isn't plugged in.
 *
 * **Representation.** A hardware twin: the display strip as the Push's scribble strip (each
 * column's name, its level as an encoder ring, its dB), the 8×8 pads with the one-layout row bands
 * labelled down the left — five rows of clips, a stop row, the song's sections, the transitions —
 * and the scene column on the right. Pads take their column's hue slot: playing solid and
 * breathing, queued outlined and blinking, stopped a dim fill, recording the danger fill. The
 * bands are the board's "no modes" rule made visible.
 *
 * **Behaviour.** Controlled: a pad asks `onPad({ row, column, slot })`, a scene `onScene(i)`.
 *
 * **Forms** (`PUSH_TWIN_FORMS`): `full` the display, banded grid and scenes; `grid` the pads alone.
 */
export function PushTwin({ form: given, tracks, sections, section, queuedSection, transitions, held, scenes, scene, selected, onPad, onScene, className }: PushTwinProps) {
  const form = useForm(PUSH_TWIN_FORMS, given);
  const columns = Array.from({ length: 8 }, (_, c) => tracks[c]);
  const playing = (t?: LiveTrack) => t?.cells.some((c) => c.state === 'playing' || c.state === 'recording') ?? false;

  const pad = (row: PushRow, column: number, slot: number | undefined, label: string, state: LiveCellState | 'lit' | 'off' | 'held' | 'stop', hue?: number) => (
    <button
      key={`${row}${slot ?? ''}-${column}`}
      type="button"
      className="lv-push__pad"
      data-row={row}
      data-state={state}
      data-hue={hue}
      disabled={!onPad}
      aria-label={`${BAND[row]} ${column + 1}${label ? `, ${label}` : ''}, ${state}`}
      onClick={() => onPad?.({ row, column, slot })}
    >
      <span className="lv-push__word">{label}</span>
    </button>
  );

  const rows = [
    ...Array.from({ length: CLIP_ROWS }, (_, slot) =>
      columns.map((t, c) => {
        const cell = t?.cells[slot];
        return pad('clips', c, slot, cell?.name ?? '', cell?.state ?? 'empty', t?.hue);
      }),
    ),
    columns.map((t, c) => pad('stop', c, undefined, '', playing(t) ? 'stop' : 'off', t?.hue)),
    Array.from({ length: 8 }, (_, c) => pad('sections', c, undefined, sections[c] ?? '', c === section ? 'lit' : c === queuedSection ? 'queued' : sections[c] ? 'stopped' : 'off')),
    Array.from({ length: 8 }, (_, c) => pad('transitions', c, undefined, transitions[c] ?? '', transitions[c] === held ? 'held' : transitions[c] ? 'stopped' : 'off')),
  ];

  const grid = (
    <div className="lv-push__grid" role="group" aria-label="Push pads">
      {rows.flat()}
    </div>
  );

  if (form === 'grid') {
    return <div className={`lv-push${className ? ` ${className}` : ''}`} data-form={form}>{grid}</div>;
  }

  return (
    <div className={`lv-push${className ? ` ${className}` : ''}`} data-form={form}>
      <Surface material="screen" radius="control" className="lv-push__display">
        {columns.map((t, c) => (
          <div key={c} className="lv-push__strip" data-hue={t?.hue} data-selected={t && t.id === selected ? 'true' : undefined}>
            <Text role="caption" truncate>
              {t?.name ?? ''}
            </Text>
            <svg viewBox="-12 -12 24 24" className="lv-push__encoder" aria-hidden="true">
              <path className="lv-push__encoder-track" d={arc(0, 0, 9, -0.375, 0.375)} />
              {t && <path className="lv-push__encoder-value" d={arc(0, 0, 9, -0.375, -0.375 + t.level * 0.75)} />}
            </svg>
            <Text role="caption" tone="muted" tabular>
              {t ? (t.level <= 0 ? '−∞' : `${(20 * Math.log10(t.level / 0.75)).toFixed(1)}`) : ''}
            </Text>
          </div>
        ))}
      </Surface>
      <div className="lv-push__bands" aria-hidden="true">
        <Text role="caption" tone="muted" case="label" className="lv-push__band" data-span="5">
          Clips
        </Text>
        <Text role="caption" tone="muted" case="label" className="lv-push__band">
          Stop
        </Text>
        <Text role="caption" tone="muted" case="label" className="lv-push__band">
          Sections
        </Text>
        <Text role="caption" tone="muted" case="label" className="lv-push__band">
          Cuts
        </Text>
      </div>
      {grid}
      <div className="lv-push__scenes" role="group" aria-label="Scenes">
        {Array.from({ length: 8 }, (_, i) => (
          <button key={i} type="button" className="lv-push__scene" data-state={i === scene ? 'lit' : scenes[i] ? 'stopped' : 'off'} disabled={!onScene || !scenes[i]} aria-label={scenes[i] ? `Scene ${i + 1}, ${scenes[i]}` : `Scene ${i + 1}, empty`} onClick={() => onScene?.(i)}>
            <span className="lv-push__word">{scenes[i] ?? ''}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

PushTwin.forms = PUSH_TWIN_FORMS;
