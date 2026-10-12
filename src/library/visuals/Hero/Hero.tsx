import type { ReactNode } from 'react';
import { Group } from '../../layout/Group';
import type { LibraryRow } from '../model/api';
import { Numbers } from '../Numbers/Numbers';
import { tileBy, tileName } from '../PresetTile/PresetTile';
import { Icon } from '../Icon/Icon';
import './Hero.css';

/** The class the picture's box wears: the app passes `<Preview className={HERO_PIC} />`. */
export const HERO_PIC = 'vs-hero-pic';

/**
 * **Job.** The Now Playing card at the top of the main column (HomeLayout's `hero` slot, inside
 * its "now playing" region): the preview large, the preset's name and author, where it plays
 * from, and its actions, as type (decision 68).
 *
 * **Changed.** The actions are a library `Group` (unlabelled: the card names them). Sizes and
 * tones read the contract and the layout's `--vs-lay-*`. The picture's box is `vs-hero-pic`
 * (`HERO_PIC`); a `Preview` placed straight in the card is styled as the box whatever class it
 * was given, so the app's `<Preview className="hero-pic" />` still works. The preview's corners
 * are Views' `Preview`'s own opaque painted corners, at the hero's radius. Nothing animates.
 *
 * **Kept.** Props, copy, accessible names and titles; the picture as one box with nothing laid
 * over it (in the app the native preview's hole), its spread shadow painting the main column
 * around it, its 16:9 shape and cap; the words beside it in a card of 680px and up, under it
 * narrower; the picture alone (`preset` left out) centred and never taller than half the column.
 *
 * From the original: with `preset` left out (round 2, Ryan's call: the playing preset's name and
 * where it plays from are in the transport bar) the hero is the picture alone, marked
 * `data-only`: centred in the main column, as wide as the column at 16:9, and never taller than
 * half the column (HomeLayout measures it), where it narrows and stays centred.
 *
 * **Tuning knobs** (Hero.css, on `.vs-hero`):
 * - `--vs-hero-cap`: the picture's tallest, about two fifths of the window, clamped to 160–440px
 *   on the scale; half the measured column (`--vs-lay-col-h`) for the picture alone.
 * - `--vs-hero-name-size` (24px): the name, a fifth over the heading size.
 * - `--vs-hole-radius`: Views' `Preview`'s corner knob, set here to the hero's
 *   `--vs-lay-hero-radius`.
 */
export interface HeroProps {
  /** The preset playing, from the index; null before anything plays. Left out (round 2: the hero is only the picture, its name in the transport bar): no name or actions column. */
  preset?: LibraryRow | null;
  /** The preview's picture: in a story a still or the preset's thumbnail (a URL); in the app a node, `<Preview className={HERO_PIC} />`, rendered as the picture's box itself. Null: nothing drawn yet. */
  picture: ReactNode | string | null;
  /** Whether the deck is moving on by itself (pause shows) or holding (play shows). */
  playing?: boolean;
  /** Where it plays from, as `playsFrom` says it: "from Warm-up, 3 of 10". */
  from?: string;
  /** Whether the preset is starred. */
  starred?: boolean;
  onPlayPause?(): void;
  onNext?(): void;
  onStar?(): void;
  /** Add it to a playlist (the caller opens its picker). */
  onAdd?(): void;
}

/** The card. */
export function Hero({ preset, picture, playing = false, from = '', starred = false, onPlayPause, onNext, onStar, onAdd }: HeroProps) {
  const info = preset !== undefined;
  const name = preset ? tileName(preset.title, preset.path) : null;
  const by = preset ? tileBy(preset.authors, preset.style) : '';
  return (
    <div className="vs-hero" data-none={preset ? undefined : ''} data-only={info ? undefined : ''}>
      <div className="vs-hero-row">
        {picture && typeof picture !== 'string' ? (
          // The app's `<Preview />`: the box itself, the native preview's hole, so nothing wraps it.
          picture
        ) : (
          <div className={HERO_PIC} data-empty={picture ? undefined : ''}>
            {typeof picture === 'string' && picture ? (
              <img src={picture} alt={name ? `preview of ${name}` : 'preview'} draggable={false} />
            ) : (
              <span className="vs-hero-pic-none">{preset ? 'Drawing…' : 'Nothing playing yet'}</span>
            )}
          </div>
        )}
        {info && (
          <div className="vs-hero-info">
            <p className="vs-hero-label">Now playing</p>
            {name ? (
              <h2 className="vs-hero-name" title={name}>
                {name}
              </h2>
            ) : (
              <h2 className="vs-hero-name" data-none="">
                Nothing playing
              </h2>
            )}
            {by && <p className="vs-hero-by">{by}</p>}
            {from && (
              <p className="vs-hero-from">
                <Numbers text={from} />
              </p>
            )}
            <Group name="actions" label={false} className="vs-hero-actions" wrap>
              <button type="button" className="vs-hero-act vs-hero-play" aria-label={playing ? 'pause' : 'play'} title={playing ? 'Hold on this preset' : 'Move on by itself again'} onClick={onPlayPause}>
                <Icon name={playing ? 'pause' : 'play'} />
                <span aria-hidden="true">{playing ? 'Pause' : 'Play'}</span>
              </button>
              <button type="button" className="vs-hero-act" aria-label="next preset" title="Next preset (→)" onClick={onNext}>
                <Icon name="next" />
                <span aria-hidden="true">Next</span>
              </button>
              <button
                type="button"
                className="vs-hero-act"
                aria-label="star"
                aria-pressed={preset ? starred : undefined}
                disabled={!preset}
                title={starred ? 'Take the star off' : 'Star it'}
                onClick={onStar}
              >
                <Icon name="star" />
                <span aria-hidden="true">{starred ? 'Starred' : 'Star'}</span>
              </button>
              <button type="button" className="vs-hero-act" aria-label="add to a playlist" title="Add it to a playlist" disabled={!preset} onClick={onAdd}>
                <Icon name="plus" />
                <span aria-hidden="true">Playlist</span>
              </button>
            </Group>
          </div>
        )}
      </div>
    </div>
  );
}
