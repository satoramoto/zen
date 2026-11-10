// Story harness (not shipped): the app a showcase DAW runs in. It keeps the DAW's document and its
// undo history, applies every intent the Workspace sends, and draws each region with the stand-in
// live set (`views/LiveSet.story.tsx`), so the whole board is linked and running. Each pane sits in
// a wrapper naming its instance, kind and resolved target, for the plays to read.
import { Workspace, openTab, type ResolvedSettings } from '../../../../layouts/Workspace/Workspace';
import { useSurfaceHost } from '../../../../layouts/Workspace/host.story';
import { LIVE_PANES, isLivePaneKind, livePanes } from '../../panes';
import { useLiveSet } from '../Views/LiveSet.story';
import { LIVE_TARGETS } from '../Views/targets';
import { DAWS, type DawId } from './daws';

export interface DawProps {
  /** Which showcase DAW. */
  daw: DawId;
  /** Run the set's clock. Off holds a still frame. */
  running?: boolean;
}

export function DawApp({ daw, running = true }: DawProps) {
  const spec = DAWS[daw];
  const host = useSurfaceHost(spec.document, { keepEditing: true, titleOf: (kind) => (isLivePaneKind(kind) ? LIVE_PANES[kind].label : kind) });
  const live = useLiveSet({ running });
  const configure = (region: string) => (settings: ResolvedSettings) => host.onIntent({ type: 'configureRegion', tab: openTab(host.document)!.id, region, settings });
  return (
    <Workspace
      name={spec.name}
      document={host.document}
      panes={livePanes}
      targets={LIVE_TARGETS}
      selected={live.selected}
      canUndo={host.canUndo}
      canRedo={host.canRedo}
      editing={host.editing}
      onIntent={host.onIntent}
      pane={(region, target, settings) => (
        <div data-testid={`pane-${region.id}`} data-kind={region.kind} data-target={target ?? ''} style={{ height: '100%', minHeight: 0 }}>
          {live.content(region, target, settings, configure(region.id))}
        </div>
      )}
    />
  );
}
