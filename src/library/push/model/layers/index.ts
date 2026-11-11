// The layers, highest first (design D3). A layer takes an input or passes it down; projection
// paints from the lowest up.
import type { Layer } from '../engine';
import { power } from './power';
import { user } from './user';
import { global } from './global';

export const LAYERS: readonly Layer[] = [power, user, global];
