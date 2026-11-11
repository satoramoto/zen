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
import { drums, slices } from './drums';
import { melodic, stepEdit } from './melodic';
import { sessionPads, sessionScreen } from './session';
import { holdMenus, recording } from './recording';
import { clipView, convert } from './clipView';
import { browser, library, setLibrary } from './browser';
import { learn, setup } from './setup';

export const LAYERS: readonly Layer[] = [power, user, overlays, codeDialog, confirm, textEntry, scaleMenu, holdMenus, trackOptions, colourPicker, convert, browser, setLibrary, setup, learn, stepEdit, sessionScreen, clipView, deviceView, mixView, tracks, library, recording, global, sessionPads, drums, slices, melodic, playing, notes64];
