import temml from 'temml';

const cache = new Map<string, string>();

const escapeAttr = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * A formula's TeX as MathML markup (one `math` element), by temml. The TeX source rides along in
 * an annotation; `label`, what the formula says in words, goes on the `math` element as its
 * accessible name. Bad TeX throws, so an entry's formulas can be checked before a page is drawn.
 */
export function toMathML(tex: string, display = false, label?: string): string {
  const key = `${display ? 'D' : 'I'}${tex}`;
  let html = cache.get(key);
  if (html === undefined) {
    html = temml.renderToString(tex, { displayMode: display, annotate: true, throwOnError: true });
    cache.set(key, html);
  }
  return label ? html.replace(/^<math\b/, `<math aria-label="${escapeAttr(label)}"`) : html;
}
