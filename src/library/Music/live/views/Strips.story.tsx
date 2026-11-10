// Story harness (not shipped): the live set with one track strips region over the rig's line, its
// settings applied by the host, for the stories that show a live pane following its settings.
import { Workspace } from '../../../layout/Workspace/Workspace';
import { useSurfaceHost } from '../../../layout/Workspace/host.story';
import type { SurfaceDocument } from '../../../layout/Workspace/Workspace.types';
import { livePanes } from '../panes';
import { useLiveSet } from './LiveSet.story';
import { LIVE_TARGETS } from './targets';

/** The live set with one strips region, its settings applied by the host. */
export function Strips({ settings }: { settings?: Record<string, readonly string[]> }) {
  const doc: SurfaceDocument = {
    version: 2,
    active: 'm',
    tabs: [
      {
        id: 'm',
        title: 'Mix',
        layout: { id: 'm-col', split: 'column', children: [{ node: 'm-1', share: 4 }, { node: 'm-2', share: 1 }] },
        regions: [
          { id: 'm-1', kind: 'mix', title: 'Track strips', binding: { mode: 'selected' }, ...(settings ? { settings } : {}) },
          { id: 'm-2', kind: 'rig', title: 'Rig health', binding: { mode: 'selected' } },
        ],
      },
    ],
  };
  const host = useSurfaceHost(doc, { keepEditing: true, editing: settings === undefined });
  const live = useLiveSet({ running: false });
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
      <output aria-label="Story: intents sent">{JSON.stringify(host.intents.filter((i) => i.type === 'configureRegion'))}</output>
      <Workspace name="Mix" document={host.document} panes={livePanes} targets={LIVE_TARGETS} editing={host.editing} onIntent={host.onIntent} pane={(r, t, s) => live.content(r, t, s)} />
    </div>
  );
}
/** The tracks the strips draw, in order. */
export const strips = (el: HTMLElement): string[] => [...el.querySelectorAll<HTMLElement>('.live-track-strips [data-track]')].map((s) => s.dataset.track!);

