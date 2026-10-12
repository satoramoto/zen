import type { Palette } from '../contract';

// Values from each Refero style's colour roles (or yahaha's Push boards).
// Anything the source doesn't define is marked "added".

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
  success: '#4fd66a',
  warning: '#ff9a2e',
  danger: '#e5534b',
  successText: '#000000', // the boards' --on-ink
  warningText: '#000000', // the boards' --on-ink
  dangerText: '#000000', // the boards' --solid-ink
  hues: ['#3b8eff', '#ff4f9e', '#ff9a2e', '#16c7a6'],
  onHue: '#000000',
  style: '#b88cff', // added: the boards' violet --a, nudged off R1's blue
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
  accent: '#5b3fd6',
  success: '#1c8040',
  warning: '#c85f00',
  danger: '#b8322c',
  successText: '#ffffff', // the boards' --on-ink
  warningText: '#000000', // added: the boards' white --on-ink is 4.1:1 on this orange
  dangerText: '#ffffff', // the boards' --on-ink
  hues: ['#1257d6', '#d0186f', '#c85f00', '#008f78'],
  onHue: '#ffffff',
  style: '#7d2fc4', // added: the boards' violet-600 is too near R1's blue
  styleText: '#ffffff',
  transport: '#004c70', // the boards' --transport (cyan-800)
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
  warning: '#ffcc00',
  danger: '#ff4d4d', // added
  successText: '#000000', // added
  warningText: '#000000', // added
  dangerText: '#000000', // added
  hues: ['#00d1ff', '#3d6bff', '#ff3dbb', '#ffcc00'], // approximated from the style's imagery notes
  onHue: '#000000',
  style: '#b48cff', // added
  styleText: '#000000', // added
  transport: '#ff8c1a', // added
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
  transport: '#005f73', // added: a dark petrol, clear of the teal category tag
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
  success: '#27a644',
  warning: '#f4c430',
  danger: '#eb5757',
  successText: '#000000', // added
  warningText: '#000000', // added
  dangerText: '#000000', // added
  hues: ['#5e6ad2', '#27a644', '#02b8cc', '#8b5cf6'],
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
