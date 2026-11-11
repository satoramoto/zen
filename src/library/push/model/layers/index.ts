// The layers, highest first (design D3). A layer takes an input or passes it down; projection
// paints from the lowest up.
import type { Layer } from '../engine';
import { power } from './power';
import { user } from './user';
import { global } from './global';
import { overlays } from './overlays';
import { codeDialog, confirm, textEntry } from './dialogs';
import { notes64, playing, scaleMenu } from './notes';
import { tracks } from './tracks';
import { colourPicker, trackOptions } from './trackOptions';
import { deviceView } from './deviceView';
import { mixView } from './mixView';

export const LAYERS: readonly Layer[] = [power, user, overlays, codeDialog, confirm, textEntry, scaleMenu, trackOptions, colourPicker, deviceView, mixView, tracks, global, playing, notes64];
