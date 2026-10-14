// Keeping the current skin between visits, guarded: storage that is missing, full, blocked or
// holding something else never breaks the app; it just isn't remembered. No React.
import { serializeSkin, parseSkin, type Skin } from './skin';

/** The part of `Storage` this needs (`localStorage` by default). */
export type SkinStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function storageOr(storage: SkinStorage | undefined): SkinStorage | null {
  if (storage) return storage;
  try {
    return typeof globalThis.localStorage === 'undefined' ? null : globalThis.localStorage;
  } catch {
    // Reading localStorage itself throws where site data is blocked.
    return null;
  }
}

/** The skin kept under `key`, or `null` when there is none, storage is unavailable, or what is
 *  kept isn't a valid skin. */
export function loadSkin(key: string, storage?: SkinStorage): Skin | null {
  try {
    const text = storageOr(storage)?.getItem(key);
    if (!text) return null;
    const read = parseSkin(text);
    return read.ok ? read.skin : null;
  } catch {
    return null;
  }
}

/** Keeps a skin under `key`; `false` when it couldn't be kept (the skin still applies for now). */
export function saveSkin(key: string, skin: Skin, storage?: SkinStorage): boolean {
  try {
    const s = storageOr(storage);
    if (!s) return false;
    s.setItem(key, serializeSkin(skin));
    return true;
  } catch {
    return false;
  }
}

/** Forgets the skin under `key`. */
export function forgetSkin(key: string, storage?: SkinStorage): void {
  try {
    storageOr(storage)?.removeItem(key);
  } catch {
    // Nothing to forget.
  }
}
