import type { CSSProperties } from 'react';
import { useForm } from '../../../layout/assembly';
import { Text } from '../../../primitives/Text';
import type { SetSong } from '../../set';
import { SETLIST_RIVER_FORMS, type SetlistRiverForm } from './SetlistRiver.forms';
import './SetlistRiver.css';

export interface SetlistRiverProps {
  /** Draw this form, outside an assembled screen (a screen's own choice wins inside one). */
  form?: SetlistRiverForm;
  /** The night, in order: songs and jams. */
  songs: readonly SetSong[];
  /** How far through the song now (0–1). */
  progress: number;
  /** Bars until the cued song lands, when one is cued. */
  barsToCue?: number;
  /** A song was picked: cue it (the app decides what a pick of the song now means). */
  onPick?: (song: string) => void;
  /** A scene of the song now was picked: launch it. */
  onScene?: (scene: string) => void;
  className?: string;
}

const LOW = 76;
const HIGH = 140;

/**
 * **Job.** The whole night in one strip: what's been played, where the set is inside the song
 * now, what's cued and how soon it lands, and what's still ahead — with the energy of the set
 * readable as a shape.
 *
 * **Representation.** A river: each song a segment as wide as its planned minutes, so the night
 * is a timeline, not a list. Over it the tempo contour (each song a plateau at its BPM, the jumps
 * between them the transitions the band has to make); under it a minute ruler. Played songs are
 * dimmed and hatched; the song now is outlined and opens into its scenes; the cued song is dashed
 * with its countdown; a jam is a dashed free stretch. One playhead runs top to bottom through all
 * three bands.
 *
 * **Behaviour.** Controlled: a song asks `onPick(id)`, a scene `onScene(id)`.
 *
 * **Forms** (`SETLIST_RIVER_FORMS`): `river` contour, songs with scenes and ruler; `strip` the
 * song segments alone.
 */
export function SetlistRiver({ form: given, songs, progress, barsToCue, onPick, onScene, className }: SetlistRiverProps) {
  const form = useForm(SETLIST_RIVER_FORMS, given);
  const total = songs.reduce((m, s) => m + s.minutes, 0) || 1;
  const nowIndex = songs.findIndex((s) => s.state === 'now');
  const before = songs.slice(0, Math.max(nowIndex, 0)).reduce((m, s) => m + s.minutes, 0);
  const at = nowIndex < 0 ? 0 : (before + progress * songs[nowIndex].minutes) / total;
  const pct = (n: number) => `${(n * 100).toFixed(3)}%`;

  // The tempo contour: one plateau per song, in minutes across and BPM up.
  let x = 0;
  const steps: string[] = [];
  const plateaus: { x: number; w: number; tempo: number; id: string }[] = [];
  songs.forEach((s, i) => {
    const y = 100 - ((s.tempo - LOW) / (HIGH - LOW)) * 100;
    steps.push(`${i === 0 ? 'M' : 'L'}${x} ${y}`, `L${x + s.minutes} ${y}`);
    plateaus.push({ x, w: s.minutes, tempo: s.tempo, id: s.id });
    x += s.minutes;
  });
  const contour = steps.join('');
  const ticks = Array.from({ length: Math.floor(total / 10) + 1 }, (_, i) => i * 10);

  return (
    <div className={`lv-river${className ? ` ${className}` : ''}`} data-form={form} style={{ '--lv-at': pct(at) } as CSSProperties}>
      {form === 'river' && (
        <div className="lv-river__contour" aria-hidden="true">
          <svg viewBox={`0 -6 ${total} 112`} preserveAspectRatio="none">
            <path className="lv-river__fill" d={`${contour}L${total} 106L0 106Z`} />
            <path className="lv-river__line" d={contour} />
          </svg>
          {plateaus.map((p) => (
            <Text key={p.id} role="caption" tone="muted" tabular className="lv-river__bpm" style={{ left: pct(p.x / total), width: pct(p.w / total), bottom: pct((p.tempo - LOW) / (HIGH - LOW)) } as CSSProperties}>
              {p.tempo}
            </Text>
          ))}
        </div>
      )}
      <ol className="lv-river__songs">
        {songs.map((s) => (
          <li key={s.id} className="lv-river__song" data-state={s.state} style={{ flexGrow: s.minutes } as CSSProperties}>
            <button type="button" className="lv-river__face" disabled={!onPick} aria-current={s.state === 'now' ? 'step' : undefined} onClick={() => onPick?.(s.id)}>
              <span className="lv-river__title">
                <Text role="caption" tone="muted" tabular>
                  {s.state === 'jam' ? '~' : s.index}
                </Text>
                <Text role="label" truncate>
                  {s.name}
                </Text>
              </span>
              <Text role="caption" tone="secondary" tabular truncate>
                {s.state === 'jam' ? 'free · tap' : `${s.key} · ${s.tempo}`}
                {s.state === 'cued' && barsToCue !== undefined ? ` · in ${barsToCue} bars` : ''}
              </Text>
            </button>
            {form === 'river' && s.state === 'now' && s.scenes && (
              <div className="lv-river__scenes" role="group" aria-label={`${s.name} scenes`}>
                {s.scenes.map((sc) => (
                  <button key={sc.id} type="button" className="lv-river__scene" data-state={sc.state} disabled={!onScene} aria-current={sc.state === 'playing' ? 'true' : undefined} onClick={() => onScene?.(sc.id)}>
                    <Text role="caption" truncate>
                      {sc.name}
                    </Text>
                  </button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>
      {form === 'river' && (
        <div className="lv-river__ruler" aria-hidden="true">
          {ticks.map((t) => (
            <Text key={t} role="caption" tone="faint" tabular className="lv-river__tick" style={{ left: pct(t / total) } as CSSProperties}>
              {t}′
            </Text>
          ))}
          <Text role="caption" tone="muted" tabular className="lv-river__end">
            {Math.round(total)}′ set
          </Text>
        </div>
      )}
      <span className="lv-river__playhead" aria-hidden="true" />
    </div>
  );
}

SetlistRiver.forms = SETLIST_RIVER_FORMS;
