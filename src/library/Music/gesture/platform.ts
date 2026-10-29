/** Live's fine modifier: Command on Apple platforms, Control elsewhere. */
const IS_MAC = typeof navigator !== 'undefined' && /Mac|iP(hone|ad|od)/.test(navigator.userAgent + ' ' + ((navigator as { platform?: string }).platform ?? ''));
export const FINE_KEY = IS_MAC ? '⌘' : 'Ctrl';
export function isFine(e: { metaKey: boolean; ctrlKey: boolean }): boolean {
  return IS_MAC ? e.metaKey : e.ctrlKey;
}
