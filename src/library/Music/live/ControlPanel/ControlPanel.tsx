import { useState, useSyncExternalStore } from 'react';
import { Tree } from '../../../view/Tree';
import { viewState } from '../../../view/viewState';
import { building, useSurfaceMode } from '../../../layout';
import { CONTROL_PANEL_REST, controlPanelHandlers, controlPanelView, type ControlPanelProps, type ControlPanelUi } from './ControlPanel.model';
import { CONTROL_PANEL_FORMS } from './ControlPanel.forms';
import '../../base.css';
import '../live.css';
import './ControlPanel.css';

export {
  CONTROL_KINDS,
  CONTROL_ROLES,
  KIND_LABEL,
  KIND_SIZE,
  ROLE_OF,
  controlLabel,
  type ControlCell,
  type ControlKind,
  type ControlPanelProps,
  type ControlParam,
  type ControlRole,
} from './ControlPanel.model';
export { CONTROL_PANEL_FORMS, type ControlPanelForm } from './ControlPanel.forms';

/**
 * The person's own controls on a grid, in mix[flow]'s face: faders, knobs, toggles, buttons, pads
 * and XYs, each bound to one of the app's parameters (`params`) and standing on the app's value
 * (`values`). A move asks `onParam`, a button or pad press and release `onTrigger`; nothing moves
 * until the app says so. While the surface edits an unlocked tab (`useSurfaceMode`) the panel is
 * built in place: an empty position adds a control, a control's tag drags it (arrows step it,
 * Shift+arrows resize it) or opens its sheet (kind, parameter, remove), its corner resizes it, and
 * every change asks `onCells` with the whole next cells. In the app's learn mode (`learning`) a
 * press asks `onLearn`; the control the app waits on (`learnTarget`) pulses; a mapped control wears
 * its mapping's mark (`mappings`) and, learning, a forget button.
 */
export function ControlPanel(props: ControlPanelProps) {
  const [own] = useState(() => viewState<ControlPanelUi>(CONTROL_PANEL_REST));
  const ui = useSyncExternalStore(own.subscribe, own.get);
  const mode = useSurfaceMode();
  return <Tree tree={controlPanelView(props, ui, building(mode) && props.onCells !== undefined)} handlers={controlPanelHandlers(props, own)} />;
}

ControlPanel.forms = CONTROL_PANEL_FORMS;

export default ControlPanel;
