export const HINT_ATTRIBUTE = 'data-hint';
export function hintFor(from: EventTarget | null): string | null {
  if (!from || typeof (from as Element).closest !== 'function') return null;
  const at = from as Element;
  const hinted = at.closest(`[${HINT_ATTRIBUTE}]`)?.getAttribute(HINT_ATTRIBUTE)?.trim();
  if (hinted) return hinted;
  return at.closest('[title]')?.getAttribute('title')?.trim() || null;
}
export function hintAttribute(hint: string | undefined): Record<string, string> { return hint === undefined ? {} : { [HINT_ATTRIBUTE]: hint }; }
