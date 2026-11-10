// Story harness (not shipped): a control panel inside an editing surface, its cells and grid in the
// region's settings, every intent applied by a story host, since building follows the surface's edit
// mode. The cells the host holds are shown for the plays to read.
import { fn, within } from 'storybook/test';
import { Workspace } from '../../../../layouts/Workspace/Workspace';
import { useSurfaceHost } from '../../../../layouts/Workspace/host.story';
import type { SurfaceDocument } from '../../../../layouts/Workspace/Workspace.types';
import { LIVE_PANES } from '../../panes';
import { ControlPanel, type ControlCell } from './ControlPanel';
import { controlParams, controlValues, macroCells } from './ControlPanel.fixtures';

/** The panel inside an editing surface, its cells and grid in the region's settings, every intent applied. */
export function Building({ cells = macroCells, columns = 8, rows = 4, editing = true }: { cells?: readonly ControlCell[]; columns?: number; rows?: number; editing?: boolean }) {
  const doc: SurfaceDocument = {
    version: 2,
    active: 't',
    tabs: [{ id: 't', title: 'Macros', layout: 'panel', regions: [{ id: 'panel', kind: 'controls', title: 'Controls', binding: { mode: 'selected' }, settings: { cells: cells as never, columns, rows } }] }],
  };
  const surface = useSurfaceHost(doc, { keepEditing: true, editing });
  const region = (surface.document.tabs[0] as (typeof doc.tabs)[0] & { regions: { settings?: Record<string, unknown> }[] }).regions[0];
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
      <output aria-label="Story: cells">{JSON.stringify(region.settings?.cells ?? [])}</output>
      <Workspace
        name="Macros"
        document={surface.document}
        panes={[LIVE_PANES.controls]}
        editing={surface.editing}
        onIntent={surface.onIntent}
        pane={(r, _t, settings) => (
          <ControlPanel
            cells={settings.cells as unknown as readonly ControlCell[]}
            columns={settings.columns as number}
            rows={settings.rows as number}
            params={controlParams}
            values={controlValues}
            onParam={fn()}
            onTrigger={fn()}
            onCells={(next) => surface.onIntent({ type: 'configureRegion', tab: 't', region: r.id, settings: { ...(r.settings ?? {}), cells: next as never } })}
          />
        )}
      />
    </div>
  );
}
/** The cells the story host holds now. */
export const cellsOf = (el: HTMLElement): ControlCell[] => JSON.parse(within(el).getByLabelText('Story: cells').textContent || '[]');

