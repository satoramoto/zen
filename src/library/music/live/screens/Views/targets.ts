// What a region of the live views can follow or pick: the stand-in set's tracks, and its cuts.
import { spineTracks } from '../../components/SignalSpine/SignalSpine.fixtures';
import { cutPadsBoard } from '../../components/CutPads/CutPads.fixtures';
import type { SurfaceTarget } from '../../../../layouts/Workspace/Workspace.types';

/** What a region can follow or pick: the set's tracks, and its cuts. */
export const LIVE_TARGETS: readonly SurfaceTarget[] = [...spineTracks.map((t) => ({ id: t.id, label: t.name, kind: 'track' })), ...cutPadsBoard.map((p) => ({ id: p.id, label: p.label, kind: 'cut' }))];
