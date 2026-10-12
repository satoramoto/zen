import type { Palette } from '../contract';

// Values from each Refero style's colour roles (or yahaha's Push boards).
// Anything the source doesn't define is marked "added".
// Every meaning-bearing colour (four part hues, success, warning, danger, style, transport,
// accent, selected) stays at least 0.12 OKLab from every other; library.test.tsx holds it.
// Where a source colour had to give way, its comment says which pair forced it.

export const pushDark: Palette = {
  id: 'push-dark',
  label: 'yahaha Push (dark)',
  scheme: 'dark',
  surface: ['#000000', '#141414', '#161616', '#262626'],
  text: ['#ffffff', '#d6d6d6', '#8c8c8c', '#4d4d4d'],
  border: '#262626',
  borderStrong: '#4d4d4d',
  action: '#ffffff',
  actionText: '#000000',
  selected: '#ffffff',
  selectedText: '#000000',
  accent: '#a58cff',
  success: '#5fdc4a', // added: the boards' green #4fd66a, yellowed off Left's teal
  warning: '#ffd60a', // added: the boards' orange #ff9a2e was Right 3's hue; a yellow
  danger: '#e5534b',
  successText: '#000000', // the boards' --on-ink
  warningText: '#000000', // the boards' --on-ink
  dangerText: '#000000', // the boards' --solid-ink
  hues: ['#3b8eff', '#ff4f9e', '#ff9a2e', '#16c7a6'],
  onHue: '#000000',
  style: '#f57aff', // added: a magenta, clear of the violet accent and Right 2's pink
  styleText: '#000000',
  transport: '#3ff4ff', // the boards' --transport (cyan-400)
  transportText: '#000000',
  keyWhite: '#ababab', // added: the redesign's light faces (the boards' were dark grey)
  keyBlack: '#141414', // added
  bloom: '6px',
};

export const pushLight: Palette = {
  id: 'push-light',
  label: 'yahaha Push (light)',
  scheme: 'light',
  surface: ['#f2f1ee', '#e2e1dd', '#e4e3df', '#d3d2ce'],
  text: ['#111111', '#2b2b2b', '#6e6e6e', '#b0afab'],
  border: '#d3d2ce',
  borderStrong: '#b0afab',
  action: '#111111',
  actionText: '#ffffff',
  selected: '#111111',
  selectedText: '#ffffff',
  accent: '#742fd3', // added: the boards' #5b3fd6, turned purpler off Right 1's blue
  success: '#1a7316', // added: the boards' #1c8040, deepened and yellowed off Left's teal
  warning: '#c29a00', // added: the boards' orange #c85f00 was Right 3's hue; an ochre
  danger: '#ac1b18', // added: the boards' #b8322c, reddened off Right 3's orange and Right 2's rose
  successText: '#ffffff', // the boards' --on-ink
  warningText: '#000000', // added: black on the ochre (7.9:1)
  dangerText: '#ffffff', // the boards' --on-ink
  hues: ['#1257d6', '#d0186f', '#c85f00', '#008f78'],
  onHue: '#ffffff',
  style: '#932180', // added: a plum magenta, clear of the accent and Right 2's rose
  styleText: '#ffffff',
  transport: '#005b6b', // added: the boards' cyan-800 #004c70, turned cyan off Right 1's blue
  transportText: '#ffffff',
  keyWhite: '#f9f8f6', // added
  keyBlack: '#1f1f1d', // added
  bloom: '0px',
};

export const elektron: Palette = {
  id: 'elektron',
  label: 'Elektron',
  scheme: 'dark',
  surface: ['#000000', '#151515', '#222222', '#333337'],
  text: ['#ffffff', '#eeeef2', '#b4b4b8', '#6a6a6a'],
  border: '#222222',
  borderStrong: '#333337',
  action: '#eeeef2',
  actionText: '#151515',
  selected: '#eeeef2',
  selectedText: '#151515',
  accent: '#ffcc00',
  success: '#3ddc84', // added
  warning: '#ff8c1a', // added: amber deepened to orange; the amber itself is the accent
  danger: '#ff4d4d', // added
  successText: '#000000', // added
  warningText: '#000000', // added
  dangerText: '#000000', // added
  // Approximated from the style's imagery notes; Left is an added lime, off the amber accent.
  hues: ['#00d1ff', '#3d6bff', '#ff3dbb', '#aaff1b'],
  onHue: '#000000',
  style: '#b48cff', // added
  styleText: '#000000', // added
  transport: '#0a9e9e', // added: a teal; the orange it wore is now the warning
  transportText: '#000000', // added
  keyWhite: '#ababab', // added
  keyBlack: '#141414', // added
  bloom: '0px',
};

export const ableton: Palette = {
  id: 'ableton',
  label: 'Ableton',
  scheme: 'light',
  surface: ['#ffffff', '#ffffff', '#eeeeee', '#e0e0e0'],
  text: ['#000000', '#000000', '#555555', '#999999'], // muted and faint added
  border: '#eeeeee',
  borderStrong: '#000000',
  action: '#0000ff',
  actionText: '#ffffff',
  selected: '#000000',
  selectedText: '#ffffff',
  accent: '#0000ff',
  success: '#00875a', // added
  warning: '#b36b00', // added
  danger: '#d4002a', // added
  successText: '#000000', // added
  warningText: '#000000', // added
  dangerText: '#ffffff', // added
  hues: ['#ff8389', '#00d2be', '#8a8aff', '#ffb347'], // last two added
  onHue: '#000000',
  style: '#7a3cc8', // added
  styleText: '#ffffff', // added
  transport: '#004c70', // added: a deep petrol blue (Push's cyan-800), clear of the success green
  transportText: '#ffffff', // added
  keyWhite: '#fcfcfc', // added
  keyBlack: '#1f1f1f', // added
  bloom: '0px',
};

export const linear: Palette = {
  id: 'linear',
  label: 'Linear',
  scheme: 'dark',
  surface: ['#08090a', '#0f1011', '#161718', '#23252a'],
  text: ['#f7f8f8', '#d0d6e0', '#8a8f98', '#62666d'],
  border: '#23252a',
  borderStrong: '#383b3f',
  action: '#e4f222',
  actionText: '#08090a',
  selected: '#23252a',
  selectedText: '#f7f8f8',
  accent: '#5e6ad2',
  success: '#86e08a', // added: Linear's green #27a644 is Right 2's hue; a lighter green
  warning: '#f4c430',
  danger: '#eb5757',
  successText: '#000000', // added
  warningText: '#000000', // added
  dangerText: '#000000', // added
  // Right 1 was the indigo accent: now an added pale blue. Left is Linear's purple label
  // colour, off the indigo.
  hues: ['#99bfff', '#27a644', '#02b8cc', '#bb87fc'],
  onHue: '#08090a',
  style: '#ff7ad9', // added: lime is the action's alone
  styleText: '#000000', // added
  transport: '#ff8a3d', // added
  transportText: '#000000', // added
  keyWhite: '#b5b6b7', // added
  keyBlack: '#151516', // added
  bloom: '0px',
};

export const palettes = [pushDark, pushLight, elektron, ableton, linear];
