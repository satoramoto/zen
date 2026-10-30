import {column, row, section, text, button, control} from './ui.mjs';
export function initial() { return {value: 35, checked: false, choice: '', input: '', count: 0}; }
export function reduce(state, action, payload, value) {
  const next = Object.assign({}, state);
  if (action === 'increment') next.count++;
  else next[action] = value;
  return next;
}
export function view(s) {
  return column([
    text('OMARCHY / RENDER LAB', {detail: 'The same module runs in the browser and Qt.'}),
    section('Composition and text', [row([text('A growing label', {grow: true}), button('Increment · ' + s.count, 'increment')]), text('Long labels must wrap without escaping the panel. <b>This is plain text, not markup.</b>', {tone: 'muted'}), text('An error should remain readable.', {tone: 'danger'})]),
    section('Controls', [control('slider', 'Level', s.value, 'value', {min: 0, max: 100, step: 5}), control('toggle', 'Enabled', s.checked, 'checked'), control('select', 'Device', s.choice, 'choice', {options: [{label: 'Speakers', value: 'speakers'}, {label: 'Headphones', value: 'headphones'}]}), control('input', 'Editable text', s.input, 'input'), button('Disabled action', 'increment', {disabled: true})]),
    text(JSON.stringify(s), {tone: 'muted'}),
  ]);
}
