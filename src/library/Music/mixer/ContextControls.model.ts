import { flag, h, slot, when, wire, type Handlers, type Node, type Root } from '../../view/Tree.model';
import { buttonFaceView } from '../controls/ButtonFace.model';

export interface ContextControlsModelProps {
  label: string;
  title?: string;
  active?: boolean;
  disabled?: boolean;
  onPress?(): void;
  pressed?: boolean;
}

export function contextControlsView({ label, title = label, active = false, disabled = false, pressed }: ContextControlsModelProps,
  { open = false, id = 'music-context' }: { open?: boolean; id?: string } = {}): Root {
  const face = buttonFaceView({ size: 'medium', className: 'play-context-trigger', 'aria-label': label, title,
    'aria-expanded': flag(open), 'aria-controls': open ? id : undefined, 'aria-haspopup': 'dialog',
    'aria-pressed': pressed, lit: pressed ?? (active || open), disabled });
  face.children = [slot('face')];
  face.bind = [['musicContextControls', { open, disabled, onPress: 'press', onOpen: 'open' }]];
  const close = buttonFaceView({ size: 'medium', 'aria-label': `Close ${label}`, title: 'Close (Escape)', 'data-music-context-close': '' });
  close.children = ['×'];
  return [face, when(open, () => wire(h('div', {
    id, class: 'wdg-popup play-context', popover: 'manual', role: 'dialog', 'aria-label': label,
  }, h('div', { class: 'play-context-heading' }, h('strong', {}, label), close), slot('children')), {
    bind: [['musicContextPanel', { onOpen: 'open' }]],
  }))];
}

export const contextControlsHandlers = (props: ContextControlsModelProps, open: (next: boolean) => void): Handlers => ({ press: props.onPress, open });

export function powerIconView(): Node {
  return h('svg', { viewBox: '0 0 20 20', width: '14', height: '14', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'aria-hidden': 'true' },
    h('path', { d: 'M10 2v8M6 4.5a7 7 0 1 0 8 0' }));
}
export function phonesIconView(): Node {
  return h('svg', { viewBox: '0 0 20 20', width: '16', height: '16', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6', 'aria-hidden': 'true' },
    h('path', { d: 'M3 12V9a7 7 0 0 1 14 0v3' }), h('rect', { x: '2', y: '10', width: '4', height: '7', rx: '1' }), h('rect', { x: '14', y: '10', width: '4', height: '7', rx: '1' }));
}
