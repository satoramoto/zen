import styles from './highlighting.css?inline';
export interface HighlightOptions { enabled: boolean; activeParameter?: string | null }
/** Presentation-only adapter for MathLive 0.111.x's rendered glyphs. Never changes its model,
 * LaTeX, selection, or undo stack. Keep the shadow-DOM dependency isolated and browser-tested. */
export function bindEquationHighlighting(field: HTMLElement, initial: HighlightOptions) {
  const shadow = field.shadowRoot;
  if (!shadow) return { update: (_options: HighlightOptions) => {}, destroy: () => {} };
  const style = document.createElement('style'); style.textContent = styles; shadow.append(style);
  let options = initial, frame = 0;
  const paint = () => {
    field.dataset.zenSyntax = String(options.enabled);
    // Only glyph leaves in the visible formula: never the keyboard, accessibility text,
    // editable input sink, or layout containers (which can hold a whole expression).
    for (const glyph of shadow.querySelectorAll<HTMLElement>('[part="content"] [data-atom-id]')) {
      if (glyph.children.length) continue;
      const text = glyph.textContent?.trim() ?? '';
      let token = '';
      if (/^(sin|cos|tan|ln|log|exp|abs|floor|ceil)$/.test(text)) token = 'function';
      else if (/^[fgh]$/.test(text)) token = `reference-${text}`;
      else if (text === 'x') token = 'position';
      else if (text === 't') token = 'time';
      else if (text === 'e' || text === 'π' || /^[\d.]+$/.test(text)) token = 'constant';
      else if (/^[a-z]$/.test(text)) token = 'parameter';
      else if (/^[+−\-×÷⋅·=]$/.test(text)) token = 'operator';
      if (token) glyph.dataset.zenMathToken = token; else delete glyph.dataset.zenMathToken;
      if (token === 'parameter' && text === options.activeParameter) glyph.dataset.zenMathActive = 'true';
      else delete glyph.dataset.zenMathActive;
    }
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; paint(); }); };
  // MathLive replaces glyphs when typing, moving the caret, or resizing. Attribute-only
  // writes above are deliberately excluded so decoration cannot trigger an observer loop.
  const observer = new MutationObserver(schedule);
  observer.observe(shadow, { childList: true, characterData: true, subtree: true });
  paint();
  return {
    update(next: HighlightOptions) { options = next; paint(); },
    destroy() { observer.disconnect(); cancelAnimationFrame(frame); style.remove(); delete field.dataset.zenSyntax; },
  };
}
