import type { Palette } from '../contract';

// Values from each Refero style's colour roles (or yahaha's Push boards, or yahaha's old desk UI).
// Anything the source doesn't define is marked "added". None of the Refero styles defines a
// second mode, so each missing mode is derived from the source's own colours.
// In every scheme, every meaning-bearing colour (four part hues, success, warning, danger, both
// roles, accent, selected) stays at least 0.12 OKLab from every other; library.test.tsx holds it.
// Where a source colour had to give way, its comment says which pair forced it.

export const push: Palette = {
  id: 'push',
  label: 'yahaha Push',
  dark: {
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
    roles: [
      '#f57aff', // added: a magenta, clear of the violet accent and Right 2's pink
      '#3ff4ff', // the boards' --transport (cyan-400)
    ],
    roleText: ['#000000', '#000000'],
    bloom: '6px',
    keys: {
      white: '#ababab', // added: the redesign's light faces (the boards' were dark grey)
      black: '#141414', // added
    },
  },
  light: {
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
    roles: [
      '#932180', // added: a plum magenta, clear of the accent and Right 2's rose
      '#005b6b', // added: the boards' cyan-800 #004c70, turned cyan off Right 1's blue
    ],
    roleText: ['#ffffff', '#ffffff'],
    bloom: '0px',
    keys: {
      white: '#f9f8f6', // added
      black: '#1f1f1d', // added
    },
  },
};

export const elektron: Palette = {
  id: 'elektron',
  label: 'Elektron',
  dark: {
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
    roles: [
      '#b48cff', // added
      '#0a9e9e', // added: a teal; the orange it wore is now the warning
    ],
    roleText: ['#000000', '#000000'], // added
    bloom: '0px',
    keys: {
      white: '#ababab', // added
      black: '#141414', // added
    },
  },
  // Added: Elektron is dark only. Its own greys, turned over: the off-white text becomes the
  // ground and the control-panel black the ink.
  light: {
    surface: ['#eeeef2', '#ffffff', '#e2e2e6', '#d4d4d8'], // added: Off White Text ground, then white; the last two added steps
    text: ['#000000', '#151515', '#56565a', '#8a8a8e'], // added: Absolute Zero and Control Panel Black; muted and faint added
    border: '#d4d4d8', // added
    borderStrong: '#b4b4b8', // added: Input Text Gray
    action: '#151515', // added: the dark CTA turned over
    actionText: '#eeeef2', // added
    selected: '#151515', // added
    selectedText: '#eeeef2', // added
    accent: '#c29200', // added: the Amber Indicator deepened to read on a light ground
    success: '#017f3b', // added: the dark green deepened, off Left's lime and the teal role
    warning: '#ea5e02', // added: the dark orange deepened, reddened off the amber accent
    danger: '#cd192a', // added: the dark red deepened
    successText: '#ffffff', // added
    warningText: '#000000', // added
    dangerText: '#ffffff', // added
    hues: ['#0090b8', '#2b52e0', '#d4179c', '#679e01'], // added: the dark hues deepened for a light ground
    onHue: '#ffffff', // added
    roles: [
      '#8547d4', // added: the dark violet deepened, purpler off Right 2's blue
      '#026772', // added: the dark teal deepened
    ],
    roleText: ['#ffffff', '#ffffff'], // added
    bloom: '0px',
    keys: {
      white: '#f8f8fa', // added
      black: '#151515', // added: Control Panel Black
    },
  },
};

export const ableton: Palette = {
  id: 'ableton',
  label: 'Ableton',
  light: {
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
    roles: [
      '#7a3cc8', // added
      '#004c70', // added: a deep petrol blue (Push's cyan-800), clear of the success green
    ],
    roleText: ['#ffffff', '#ffffff'], // added
    bloom: '0px',
    keys: {
      white: '#fcfcfc', // added
      black: '#1f1f1f', // added
    },
  },
  // Added: Ableton is light only. Its black and white swap places; Studio Gray steps up from
  // the ground; the Electric Violet action and the badge hues stay.
  dark: {
    surface: ['#000000', '#000000', '#1a1a1a', '#2a2a2a'], // added: Midnight Ink ground; the raised steps added
    text: ['#ffffff', '#ffffff', '#aaaaaa', '#666666'], // added: Canvas White; muted and faint added
    border: '#1a1a1a', // added
    borderStrong: '#ffffff', // added: the black rules turned white
    action: '#0000ff', // Electric Violet
    actionText: '#ffffff',
    selected: '#ffffff', // added: the black selection turned white
    selectedText: '#000000', // added
    accent: '#4d4dff', // added: Electric Violet lightened to show on black, kept off Left's lavender
    success: '#36b958', // added: a green, off Right 2's teal
    warning: '#ffe630', // added: a yellow, off Left's apricot
    danger: '#ff3254', // added: the light red brightened
    successText: '#000000', // added
    warningText: '#000000', // added
    dangerText: '#000000', // added
    hues: ['#ff8389', '#00d2be', '#8a8aff', '#ffb347'], // Melody Red, Synth Teal; last two added
    onHue: '#000000',
    roles: [
      '#db77ff', // added: the light plum lightened, off Left's lavender
      '#018fd2', // added: the light petrol blue lightened
    ],
    roleText: ['#000000', '#000000'], // added
    bloom: '0px', // added: Ableton stays flat
    keys: {
      white: '#eeeeee', // added: Studio Gray
      black: '#1a1a1a', // added
    },
  },
};

export const linear: Palette = {
  id: 'linear',
  label: 'Linear',
  dark: {
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
    roles: [
      '#ff7ad9', // added: lime is the action's alone
      '#ff8a3d', // added
    ],
    roleText: ['#000000', '#000000'], // added
    bloom: '0px',
    keys: {
      white: '#b5b6b7', // added
      black: '#151516', // added
    },
  },
  // Added: Linear is dark only. Porcelain becomes the ground, Pitch Black the ink, Alabaster the
  // rules; the Neon Lime action and Aether Blue accent stay.
  light: {
    surface: ['#f7f8f8', '#ffffff', '#efeff0', '#e5e5e6'], // added: Porcelain, white, an added step, Alabaster
    text: ['#08090a', '#23252a', '#62666d', '#8a8f98'], // added: Pitch Black, Charcoal Grey, Fog Grey, Storm Cloud
    border: '#e5e5e6', // added: Alabaster
    borderStrong: '#d0d6e0', // added: Light Steel
    action: '#e4f222', // Neon Lime
    actionText: '#08090a',
    selected: '#e5e5e6', // added: the dark selection's raised grey, turned over
    selectedText: '#08090a', // added
    accent: '#5e6ad2', // Aether Blue
    success: '#007c13', // added: Forest Green #008d2c, deepened off Right 2's Emerald
    warning: '#a79600', // added: the dark yellow deepened, greened off the orange role
    danger: '#d9263a', // added: Warning Red deepened for white ink, off the orange role
    successText: '#ffffff', // added
    warningText: '#000000', // added
    dangerText: '#ffffff', // added
    // Right 1 an added azure, off the Aether Blue accent; Right 2 Emerald; Right 3 Cyan Spark
    // deepened; Left Amethyst, pushed purpler off the accent.
    hues: ['#009af9', '#27a644', '#0293a3', '#9f51ff'],
    onHue: '#ffffff', // added
    roles: [
      '#d02e9e', // added: the dark pink deepened
      '#da6b0b', // added: the dark orange deepened
    ],
    roleText: ['#ffffff', '#000000'], // added
    bloom: '0px',
    keys: {
      white: '#ffffff', // added
      black: '#23252a', // added: Charcoal Grey
    },
  },
};

// Classic: yahaha's pre-minimalism desk UI (app/src/app.css): anodised graphite in dark,
// brushed aluminium in light, glass displays and lit pads.
export const classic: Palette = {
  id: 'classic',
  label: 'yahaha Classic',
  dark: {
    surface: ['#131519', '#23272d', '#30353c', '#3b4048'], // --bg, --chassis-lo (--panel), --raised-lo, --chassis-hi
    text: ['#ece8df', '#9aa2ad', '#8a929d', '#555c66'], // --ink, --engrave, --muted, --line-strong
    border: '#3a4048', // --line
    borderStrong: '#555c66', // --line-strong
    action: '#f3b843', // --accent
    actionText: '#1b1400', // --accent-ink
    selected: '#ece8df', // --ink: the chosen tab's lit face
    selectedText: '#131519', // --bg
    accent: '#f3b843', // --accent
    success: '#02c31e', // the lit pads' green; the meter's #3fd67a was Right 3's hue
    warning: '#ffeb44', // the meter's yellow #ffd23f, lightened off the amber accent
    danger: '#fe4e66', // --danger #ff7a6b, reddened off Left's orange
    successText: '#000000', // added
    warningText: '#000000', // added
    dangerText: '#000000', // added
    // --part-r1, --part-r2, --part-r3; Left is --part-left #ff9f4f, deepened off the amber accent.
    hues: ['#4cc2ff', '#b98cff', '#5fdc92', '#fd7d00'],
    onHue: '#131519', // added: --bg
    roles: [
      '#ff6bd0', // the mixer's part-colour pink (parts.ts)
      '#08b7aa', // the mixer's part-colour teal #3fd6c6 (parts.ts), deepened off Right 1 and Right 3
    ],
    roleText: ['#000000', '#000000'], // added
    bloom: '6px', // the lit pads' glow
    keys: {
      white: '#d9d6cf', // --key-white
      black: '#0b0c0e', // --key-black
    },
  },
  light: {
    surface: ['#c9ced4', '#cfd4d9', '#dde1e5', '#eef0f2'], // --bg, --chassis-lo (--panel), --raised-lo, --chassis-hi
    text: ['#1a1f26', '#4e5864', '#5a6470', '#8d96a0'], // --ink, --engrave, --muted, --line-strong
    border: '#b4bbc3', // --line
    borderStrong: '#8d96a0', // --line-strong
    action: '#8f5b00', // added: --accent #a86b00 deepened; its --accent-ink was 4.2:1 on it
    actionText: '#fff8e6', // --accent-ink
    selected: '#1a1f26', // --ink
    selectedText: '#eef0f2', // --chassis-hi
    accent: '#a86b00', // --accent
    success: '#0b6b1a', // added: the lit pads' green deepened, off Right 3
    warning: '#c9a000', // added: the meter's yellow deepened
    danger: '#b3261e', // --danger
    successText: '#ffffff', // added
    warningText: '#000000', // added
    dangerText: '#ffffff', // added
    // --part-r1, --part-r2, --part-r3; Left is --part-left #e0701a, reddened off the amber accent.
    hues: ['#0a8fd6', '#8750e0', '#1f9e55', '#ed6f1c'],
    onHue: '#ffffff', // added
    roles: [
      '#c0309a', // added: the dark pink deepened
      '#008082', // added: the dark teal deepened
    ],
    roleText: ['#ffffff', '#ffffff'], // added
    bloom: '0px',
    keys: {
      white: '#fbfaf7', // --key-white (light)
      black: '#0b0c0e', // --key-black
    },
  },
};

export const palettes: Palette[] = [push, elektron, ableton, linear, classic];
