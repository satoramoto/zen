import type { Chrome } from '../contract';

export const pushChrome: Chrome = {
  id: 'push',
  label: 'yahaha Push (no boxes, hairlines)',
  radiusControl: '0px',
  radiusCard: '0px',
  radiusInput: '0px',
  radiusPill: '0px',
  borderWidth: '1px',
  card: { fill: 'none', borderTop: '1px', borderSides: '0px', shadow: 'none' },
  input: 'underline',
};

export const elektronChrome: Chrome = {
  id: 'elektron',
  label: 'Elektron (square, flat panels)',
  radiusControl: '0px',
  radiusCard: '0px',
  radiusInput: '7px',
  radiusPill: '0px',
  borderWidth: '1.5px',
  card: { fill: 'surface', borderTop: '0px', borderSides: '0px', shadow: 'none' },
  input: 'filled',
};

export const abletonChrome: Chrome = {
  id: 'ableton',
  label: 'Ableton (square, rules)',
  radiusControl: '0px',
  radiusCard: '0px',
  radiusInput: '0px',
  radiusPill: '0px',
  borderWidth: '1px',
  card: { fill: 'none', borderTop: '2px', borderSides: '0px', shadow: 'none' },
  input: 'filled',
};

export const linearChrome: Chrome = {
  id: 'linear',
  label: 'Linear (6px, layered)',
  radiusControl: '6px',
  radiusCard: '6px',
  radiusInput: '6px',
  radiusPill: '9999px',
  borderWidth: '1px',
  card: { fill: 'surface', borderTop: '1px', borderSides: '1px', shadow: 'rgba(0, 0, 0, 0.4) 0px 2px 4px 0px' },
  input: 'box',
};

export const chromes = [pushChrome, elektronChrome, abletonChrome, linearChrome];
