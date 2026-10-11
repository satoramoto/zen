import type { Density } from '../contract';

export const compact: Density = { id: 'compact', label: 'Compact (4px)', unit: 4, control: 28 };
export const regular: Density = { id: 'regular', label: 'Regular (5px)', unit: 5, control: 34 };
export const airy: Density = { id: 'airy', label: 'Airy (6px)', unit: 6, control: 40 };

export const densities = [compact, regular, airy];
