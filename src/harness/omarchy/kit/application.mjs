// Shared application presentation constants and glyphs for browser and QML.
export const metrics = { gap: 12, padding: 20, surfacePadding: 16, radius: 12, control: 34, size: 13, small: 11, line: 18 };
export const icons = {
  brain: ['M12 5c-1-3-5-3-6 0-3 0-5 4-3 6-2 2-1 6 2 7 0 4 6 5 7 1 1 4 7 3 7-1 3-1 4-5 2-7 2-2 0-6-3-6-1-3-5-3-6 0Z', 'M12 5v14M6 5c0 2 1 3 3 3M3 11h3c2 0 3-1 3-3M5 18v-3c0-2 2-3 4-2M18 5c0 2-1 3-3 3M21 11h-3c-2 0-3-1-3-3M19 18v-3c0-2-2-3-4-2'],
  refresh: ['M20 7v5h-5M4 17v-5h5', 'M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1'],
  up: ['m8 5 11 7-11 7Z'], down: ['M6 6h12v12H6Z'],
  logs: ['M3 4h18v16H3Z', 'm7 9 3 3-3 3m6 0h4'],
};
export function iconSvg(name, color) {
  const paths = icons[name];
  if (!paths) return '';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + paths.map(d => '<path d="' + d + '"/>').join('') + '</svg>');
}

// Same plain-data builders, with the richer application type vocabulary.
export { element, column, row, text, button, section, control } from './ui.mjs';

export const nativeIcons = {brain:'󰧑',up:'󰐊',down:'󰓛',logs:'󰆍',refresh:'󰑓'};
