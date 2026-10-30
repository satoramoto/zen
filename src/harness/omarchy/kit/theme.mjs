// One structural contract for both renderers. Native hosts override palette/font
// from Commons; preview hosts select a fixture or pass that same snapshot.
export const dark = {background:'#1a1b26', foreground:'#c0caf5', muted:'#8993b5', accent:'#7aa2f7', urgent:'#f7768e', font:'JetBrains Mono', size:13, small:11, line:20, smallLine:16, gap:12, rowGap:8, padding:20, border:1, radius:0, control:34};
export const light = Object.assign({}, dark, {background:'#f5f5f0', foreground:'#24283b', muted:'#575f78', accent:'#3159a3', urgent:'#ae314b'});
export function themeOf(value) { return typeof value === 'object' ? Object.assign({}, dark, value) : value === 'light' ? light : dark; }
