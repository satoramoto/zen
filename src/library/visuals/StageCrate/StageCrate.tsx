import { Text } from '../../primitives/Text';
import { Crate } from '../Crate/Crate';
import type { StageCrateProps } from '../model/stage-model';
import { Mark } from '../Views/Views';
import './StageCrate.css';

/**
 * **Job.** The Stage's crate down the left (see `StageCrateProps`): what goes in
 * Home's inset sidebar panel — the mark under the window buttons' band, then the
 * crate itself (`Crate`: playlists, moods and up next, each folding under its
 * heading), whose sections scroll inside the panel. The panel is the shell's
 * (`StageLayout`): the `nav` named for the crate with the id `STAGE_CRATE_ID`,
 * its band, its opaque paint, where it sits, and the laid-over crate's Esc,
 * press outside and focus. This draws only what is in it; put away (`mode`
 * 'hidden') it draws nothing.
 *
 * **Changed.** Only the frame around the crate is styled here (the mark's row and
 * the reading note) on the scale's sizes: the panel is a body Text the crate inherits, the note
 * a Text at `--vs-text-annot`; the crate's own rows, headings and
 * scrolling are the sibling `Crate`'s, which the original's stage-crate.css used
 * to draw.
 *
 * **Kept.** The props, the mark, the note and what is handed to `Crate`.
 */
export function StageCrate({ live, mode }: StageCrateProps) {
  if (mode === 'hidden') return null;
  return (
    <Text as="div" className="vs-stagecrate" data-mode={mode}>
      <div className="vs-stagecrate-mark">
        <Mark />
      </div>
      {live.lists ? (
        <Crate lists={live.lists} data={live.data} act={live.act} onLists={live.setLists} onError={live.fail("Couldn't read or change what's up next.")} current={live.current} />
      ) : (
        <Text as="p" className="vs-stagecrate-note">
          Reading the playlists…
        </Text>
      )}
    </Text>
  );
}
