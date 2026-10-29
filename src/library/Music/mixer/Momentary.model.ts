import type { Handlers, Node } from '../../view/Tree.model';
import { buttonFaceView } from '../controls/ButtonFace.model';

export interface MomentaryModelProps {
  label: string;
  held: boolean;
  disabled?: boolean;
  onHold(held: boolean): void;
  onTakeover?(): void;
}

export function momentaryView({ label, held, disabled }: MomentaryModelProps): Node {
  const face = buttonFaceView({ size: 'medium', className: 'play-hold', 'aria-label': label, lit: held, disabled,
    title: 'Hold to audition; while holding Space, press Enter to keep playing' });
  face.bind = [['musicMomentary', { disabled, onHold: 'hold', onTakeover: 'takeover' }]];
  return face;
}
export const momentaryHandlers = (props: MomentaryModelProps): Handlers => ({ hold: props.onHold, takeover: props.onTakeover });
