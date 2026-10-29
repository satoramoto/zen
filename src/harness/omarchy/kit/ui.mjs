// The portable vocabulary. Plain ES modules run in both Vite and Qt's JS engine.
// Views contain data only; actions cross the host boundary by name and payload.
export function element(kind, props = {}, children = []) {
  return Object.assign({kind, children}, props);
}
export function column(children, props = {}) { return element('column', props, children); }
export function row(children, props = {}) { return element('row', props, children); }
export function text(label, props = {}) { return element('text', Object.assign({label}, props)); }
export function button(label, action, props = {}) { return element('button', Object.assign({label, action}, props)); }
export function section(label, children) { return element('section', {label}, children); }
export function control(kind, label, value, action, props = {}) {
  return element(kind, Object.assign({label, value, action}, props));
}
