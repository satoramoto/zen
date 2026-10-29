import { bindPopup } from '../controls/Popup.input';

export interface ContextControlsParams {
  open: boolean;
  disabled?: boolean;
  onPress?(): void;
  onOpen?(open: boolean): void;
}
export interface ContextPanelParams { onOpen?(open: boolean): void }

/** Primary click is distinct from Shift-click/right-click/the context-menu key. */
export function bindContextControls(node: HTMLElement, initial: ContextControlsParams) {
  let params = initial;
  const toggle = () => params.onOpen?.(!params.open);
  const click = (e: MouseEvent) => {
    if (params.disabled) return;
    if (params.onPress && !e.shiftKey) params.onPress();
    else toggle();
  };
  const context = (e: MouseEvent) => {
    if (!params.disabled && params.onPress) { e.preventDefault(); toggle(); }
  };
  const key = (e: KeyboardEvent) => {
    if (!params.disabled && params.onPress && (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10'))) {
      e.preventDefault();
      toggle();
    }
  };
  node.addEventListener('click', click);
  node.addEventListener('contextmenu', context);
  node.addEventListener('keydown', key);
  return {
    update(next: ContextControlsParams) { params = next; if (params.disabled && params.open) params.onOpen?.(false); },
    destroy() { node.removeEventListener('click', click); node.removeEventListener('contextmenu', context); node.removeEventListener('keydown', key); },
  };
}

/** Close furniture returns focus; pointer/wheel dismissal deliberately does not steal it. */
export function bindContextPanel(node: HTMLElement, initial: ContextPanelParams) {
  let params = initial;
  const trigger = () => node.previousElementSibling as HTMLElement | null;
  const close = (restore: boolean) => {
    const anchor = trigger();
    params.onOpen?.(false);
    if (restore) anchor?.focus();
  };
  const popup = bindPopup(node, { onDismiss: how => close(how === 'escape') });
  const click = (e: MouseEvent) => {
    if (e.target instanceof Element && e.target.closest('[data-music-context-close]')) close(true);
  };
  node.addEventListener('click', click);
  return {
    update(next: ContextPanelParams) { params = next; },
    destroy() { node.removeEventListener('click', click); popup.destroy(); },
  };
}
