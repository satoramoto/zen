// A skin: a theme pack as plain JSON, portable between zen apps. It names a base pack, may swap
// any facet for another named one, and overrides single values inside the facets. No React, no
// storage, no DOM: a Vue or Svelte binding wraps these exactly as the React components do
// (docs/theme-editor.md).
import { LAYERS, type Facets, type Faces, type LayerName, type Materials, type Scale, type Scheme } from '../contract';
import { FROM_THEME, resolveTheme } from '../resolve';
import { packs, type ThemePack } from '../themes/packs';
import { palettes } from '../themes/palettes';
import { faces } from '../themes/faces';
import { scales } from '../themes/scales';
import { materials } from '../themes/materials';

export const SKIN_FORMAT = 'zen-skin';
export const SKIN_VERSION = 1;

export const FACET_NAMES = ['palette', 'faces', 'scale', 'materials'] as const;
export type FacetName = (typeof FACET_NAMES)[number];

/** The facet lists a skin may swap a whole facet from, by id. */
export const FACET_LISTS: Record<FacetName, readonly { id: string; label: string }[]> = { palette: palettes, faces, scale: scales, materials };

export const SHADER_NAMES = ['water', 'ether', 'glass'] as const;
export type ShaderName = (typeof SHADER_NAMES)[number];

/** An array override: an entry left `null` keeps the base's value at that index. */
type Holes<T extends readonly unknown[]> = readonly (T[number] | null)[];
/** Any part of a value, all the way down; arrays override entry by entry. */
type DeepPartial<T> = T extends readonly unknown[] ? Holes<T> : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

/** One mode's colour overrides: any `Scheme` role. */
export type SchemeOverrides = DeepPartial<Scheme>;

/** Overrides inside each facet. The facets' `id` and `label` are never overridden. */
export interface SkinOverrides {
  palette?: { light?: SchemeOverrides; dark?: SchemeOverrides };
  faces?: Partial<Omit<Faces, 'id' | 'label'>>;
  scale?: DeepPartial<Omit<Scale, 'id' | 'label'>>;
  /** `shaders`: a layer set to `null` drops the base's shader there. */
  materials?: DeepPartial<Omit<Materials, 'id' | 'label' | 'shaders'>> & { shaders?: Partial<Record<LayerName, ShaderName | null>> };
}

/**
 * A skin, as JSON:
 *
 * ```json
 * { "format": "zen-skin", "version": 1, "id": "linear-custom", "label": "Linear (custom)",
 *   "base": "linear", "facets": { "faces": "instrument" },
 *   "overrides": { "palette": { "dark": { "accent": "#ff7a59" } }, "scale": { "control": 32 } } }
 * ```
 */
export interface Skin {
  format: typeof SKIN_FORMAT;
  version: typeof SKIN_VERSION;
  id: string;
  label: string;
  /** The theme pack it starts from (`themes/packs.ts`). */
  base: string;
  /** A whole facet swapped for another named one (as the Storybook toolbar does). */
  facets?: Partial<Record<FacetName, string>>;
  overrides?: SkinOverrides;
}

/** A path into the overrides: a facet, then keys and indices (`['palette', 'dark', 'hues', 2]`). */
export type OverridePath = readonly [FacetName, ...(string | number)[]];

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);

/* ---------- making and resolving ---------- */

/** The skin that is exactly a pack (by pack or id): no swaps, no overrides. */
export function skinFromPack(pack: ThemePack | string): Skin {
  const p = typeof pack === 'string' ? packs.find((x) => x.id === pack) : pack;
  if (!p) throw new Error(`No theme pack with id '${pack}'`);
  return { format: SKIN_FORMAT, version: SKIN_VERSION, id: p.id, label: p.label, base: p.id };
}

function merge(base: unknown, over: unknown): unknown {
  if (over === undefined) return base;
  if (Array.isArray(over)) {
    if (!Array.isArray(base)) return base;
    return base.map((v, i) => (over[i] === undefined || over[i] === null ? v : merge(v, over[i])));
  }
  if (isObj(over)) {
    const out: Obj = isObj(base) ? { ...base } : {};
    for (const [k, v] of Object.entries(over)) {
      if (v === null) delete out[k];
      else out[k] = merge(out[k], v);
    }
    return out;
  }
  return over;
}

/** The facets with a skin's overrides laid over them. Pure: the facets passed in are not changed. */
export function applyOverrides(facets: Facets, overrides: SkinOverrides | undefined): Facets {
  if (!overrides) return facets;
  const palette = overrides.palette
    ? { ...facets.palette, light: merge(facets.palette.light, overrides.palette.light) as Scheme, dark: merge(facets.palette.dark, overrides.palette.dark) as Scheme }
    : facets.palette;
  return {
    palette,
    faces: overrides.faces ? (merge(facets.faces, overrides.faces) as Faces) : facets.faces,
    scale: overrides.scale ? (merge(facets.scale, overrides.scale) as Scale) : facets.scale,
    materials: overrides.materials ? (merge(facets.materials, overrides.materials) as Materials) : facets.materials,
  };
}

/** The base facets a skin's overrides apply to: its pack with its swaps, before any override. */
export function baseFacets(skin: Pick<Skin, 'base' | 'facets'>): Facets {
  return resolveTheme({ theme: skin.base, ...skin.facets }).facets;
}

/** A skin as a theme pack: the base pack's principles and notes, with the skin's id, label and facets. */
export function resolveSkin(skin: Skin): { pack: ThemePack; facets: Facets } {
  const { pack, facets: swapped } = resolveTheme({ theme: skin.base, ...skin.facets });
  const facets = applyOverrides(swapped, skin.overrides);
  // The stand-in desktop belongs to the pack's own palette.
  const desktop = swapped.palette === pack.facets.palette ? pack.desktop : undefined;
  return { pack: { ...pack, id: skin.id, label: skin.label, facets, desktop }, facets };
}

/** Whether a skin differs from its base pack at all. */
export function isCustom(skin: Skin): boolean {
  const n = normalizeSkin(skin);
  return n.facets !== undefined || n.overrides !== undefined;
}

/* ---------- validating ---------- */

export type SkinResult = { ok: true; skin: Skin } | { ok: false; errors: string[] };

const HEX = /^#[0-9a-f]{6}$/i;
const MAX_STRING = 2000;
/** The enumerated values the contract allows, by override path (dots, no indices). */
const ENUMS: Record<string, readonly string[]> = {
  'faces.labelCase': ['none', 'uppercase'],
  'materials.input': ['filled', 'box', 'underline'],
};
/** Ranges for numbers, by override path. */
const RANGES: Record<string, readonly [number, number]> = {
  'faces.weightBody': [100, 1000],
  'faces.weightStrong': [100, 1000],
  'faces.weightDisplay': [100, 1000],
  'faces.weightNumeral': [100, 1000],
  'scale.unit': [1, 32],
  'scale.control': [12, 96],
  'scale.sizes': [6, 200],
};

/**
 * CSS a skin may carry. A value fetching from the network (`url(…)` other than `data:`,
 * `@import`, `image-set`) would let an imported file call home, so it is refused.
 */
function cssProblem(v: string): string | undefined {
  if (v.length > MAX_STRING) return `is longer than ${MAX_STRING} characters`;
  if (/[;{}]/.test(v) || /@import/i.test(v)) return 'may not contain ; { } or @import';
  for (const m of v.matchAll(/url\(\s*(['"]?)\s*([^'")\s]*)/gi)) if (!/^data:/i.test(m[2])) return 'may only use data: URLs';
  if (/image-set\(|src\(/i.test(v)) return 'may not fetch images';
  return undefined;
}

function checkOverride(path: string[], base: unknown, over: unknown, errors: string[]) {
  const at = path.join('.');
  const key = path.filter((p) => !/^\d+$/.test(p)).join('.');
  if (Array.isArray(base)) {
    if (!Array.isArray(over)) return void errors.push(`${at}: expected a list`);
    if (over.length > base.length) errors.push(`${at}: at most ${base.length} entries`);
    over.slice(0, base.length).forEach((v, i) => v !== null && checkOverride([...path, String(i)], base[i], v, errors));
    return;
  }
  if (isObj(base)) {
    if (!isObj(over)) return void errors.push(`${at}: expected an object`);
    for (const [k, v] of Object.entries(over)) {
      if (!(k in base)) errors.push(`${at}.${k}: not part of the contract`);
      else checkOverride([...path, k], base[k], v, errors);
    }
    return;
  }
  if (typeof base === 'number') {
    if (typeof over !== 'number' || !Number.isFinite(over)) return void errors.push(`${at}: expected a number`);
    const range = RANGES[key] ?? RANGES[path.slice(0, 2).join('.')];
    if (range && (over < range[0] || over > range[1])) errors.push(`${at}: ${over} is outside ${range[0]}–${range[1]}`);
    return;
  }
  if (typeof over !== 'string') return void errors.push(`${at}: expected text`);
  if (ENUMS[key] && !ENUMS[key].includes(over)) return void errors.push(`${at}: one of ${ENUMS[key].join(', ')}`);
  if (path[0] === 'palette' && path.at(-1) !== 'bloom' && !HEX.test(over)) return void errors.push(`${at}: a colour as #rrggbb`);
  const problem = cssProblem(over);
  if (problem) errors.push(`${at}: ${problem}`);
}

/** Checks a value is a skin this zen can wear: a known base, known facet ids, and overrides that
 *  fit the contract (each the same type as the value it replaces, colours as #rrggbb, CSS that
 *  fetches nothing). On success the skin comes back normalized (`normalizeSkin`). */
export function validateSkin(value: unknown): SkinResult {
  const errors: string[] = [];
  if (!isObj(value)) return { ok: false, errors: ['A skin is a JSON object'] };
  if (value.format !== SKIN_FORMAT) errors.push(`format: expected "${SKIN_FORMAT}"`);
  if (value.version !== SKIN_VERSION) errors.push(`version: expected ${SKIN_VERSION}`);
  for (const k of ['id', 'label'] as const) {
    const v = value[k];
    if (typeof v !== 'string' || !v.trim()) errors.push(`${k}: expected text`);
    else if (v.length > 200) errors.push(`${k}: at most 200 characters`);
  }
  const base = value.base;
  if (typeof base !== 'string' || !packs.some((p) => p.id === base)) errors.push(`base: no theme pack '${String(base)}' (one of ${packs.map((p) => p.id).join(', ')})`);
  const known = new Set(['format', 'version', 'id', 'label', 'base', 'facets', 'overrides']);
  for (const k of Object.keys(value)) if (!known.has(k)) errors.push(`${k}: not part of a skin`);

  if (value.facets !== undefined) {
    if (!isObj(value.facets)) errors.push('facets: expected an object');
    else
      for (const [k, v] of Object.entries(value.facets)) {
        if (!(FACET_NAMES as readonly string[]).includes(k)) errors.push(`facets.${k}: not a facet (${FACET_NAMES.join(', ')})`);
        else if (v !== FROM_THEME && !FACET_LISTS[k as FacetName].some((f) => f.id === v)) errors.push(`facets.${k}: no ${k} '${String(v)}'`);
      }
  }
  if (errors.length) return { ok: false, errors };

  const o = value.overrides;
  if (o !== undefined) {
    if (!isObj(o)) return { ok: false, errors: ['overrides: expected an object'] };
    const facets = baseFacets({ base: base as string, facets: value.facets as Skin['facets'] });
    for (const [k, v] of Object.entries(o)) {
      if (!(FACET_NAMES as readonly string[]).includes(k)) {
        errors.push(`overrides.${k}: not a facet (${FACET_NAMES.join(', ')})`);
        continue;
      }
      if (!isObj(v)) {
        errors.push(`overrides.${k}: expected an object`);
        continue;
      }
      const facet = facets[k as FacetName] as unknown as Obj;
      for (const [field, fv] of Object.entries(v)) {
        if (field === 'id' || field === 'label') errors.push(`overrides.${k}.${field}: a facet's ${field} is not overridden`);
        else if (k === 'palette' && field !== 'light' && field !== 'dark') errors.push(`overrides.palette.${field}: palette overrides are per mode (light, dark)`);
        else if (k === 'materials' && field === 'shaders') {
          if (!isObj(fv)) errors.push('overrides.materials.shaders: expected an object');
          else
            for (const [layer, s] of Object.entries(fv)) {
              if (!(LAYERS as readonly string[]).includes(layer)) errors.push(`overrides.materials.shaders.${layer}: not a layer (${LAYERS.join(', ')})`);
              else if (s !== null && !(SHADER_NAMES as readonly unknown[]).includes(s)) errors.push(`overrides.materials.shaders.${layer}: one of ${SHADER_NAMES.join(', ')} or null`);
            }
        } else if (!(field in facet)) errors.push(`overrides.${k}.${field}: not part of the contract`);
        else checkOverride([k, field], facet[field], fv, errors);
      }
    }
    // Report paths from the skin's root.
    for (let i = 0; i < errors.length; i++) if (!errors[i].startsWith('overrides.')) errors[i] = `overrides.${errors[i]}`;
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, skin: normalizeSkin(value as unknown as Skin) };
}

/* ---------- normal form, JSON ---------- */

/** Drops what changes nothing: undefined values, empty objects, trailing `null`s in lists, and
 *  facet swaps back to the pack's own. Keys inside `overrides` are sorted, so equal skins
 *  serialize alike. */
function prune(v: unknown, inArray = false): unknown {
  if (Array.isArray(v)) {
    const out = v.map((x) => (x === undefined ? null : prune(x, true)));
    while (out.length && out[out.length - 1] === null) out.pop();
    return out.length ? out : undefined;
  }
  if (isObj(v)) {
    const out: Obj = {};
    for (const k of Object.keys(v).sort()) {
      const p = v[k] === null ? null : prune(v[k]);
      if (p !== undefined) out[k] = p;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return v === undefined && inArray ? null : v;
}

/** A skin in its normal form (see `prune`), with its keys in the documented order. */
export function normalizeSkin(skin: Skin): Skin {
  const out: Skin = { format: SKIN_FORMAT, version: SKIN_VERSION, id: skin.id, label: skin.label, base: skin.base };
  const facets: Partial<Record<FacetName, string>> = {};
  for (const f of FACET_NAMES) {
    const id = skin.facets?.[f];
    if (id && id !== FROM_THEME) facets[f] = id;
  }
  if (Object.keys(facets).length) out.facets = facets;
  const overrides: Obj = {};
  for (const f of FACET_NAMES) {
    const p = prune(skin.overrides?.[f]);
    if (p !== undefined) overrides[f] = p;
  }
  if (Object.keys(overrides).length) out.overrides = overrides as SkinOverrides;
  return out;
}

/** The skin as JSON text: its normal form, indented, ending in a newline. */
export function serializeSkin(skin: Skin): string {
  return `${JSON.stringify(normalizeSkin(skin) as unknown as Json, null, 2)}\n`;
}

/** Reads skin JSON text: `{ ok, skin }` in normal form, or `{ ok: false, errors }` saying what is wrong. */
export function parseSkin(text: string): SkinResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (e) {
    return { ok: false, errors: [`Not JSON: ${e instanceof Error ? e.message : String(e)}`] };
  }
  return validateSkin(value);
}

/* ---------- editing: the editor's state, framework-free ---------- */

function getIn(v: unknown, path: readonly (string | number)[]): unknown {
  let at: unknown = v;
  for (const k of path) {
    if (at === null || typeof at !== 'object') return undefined;
    at = (at as Record<string | number, unknown>)[k];
  }
  return at;
}

function setIn(v: unknown, path: readonly (string | number)[], value: unknown): unknown {
  if (!path.length) return value;
  const [k, ...rest] = path;
  if (typeof k === 'number') {
    const arr = Array.isArray(v) ? [...v] : [];
    while (arr.length < k) arr.push(null);
    arr[k] = setIn(arr[k], rest, value);
    return arr;
  }
  const obj: Obj = isObj(v) ? { ...v } : {};
  obj[k] = setIn(obj[k], rest, value);
  return obj;
}

/** The value a skin overrides at `path`, or `undefined` where it keeps the base's. */
export function getOverride(skin: Skin, path: OverridePath): unknown {
  const v = getIn(skin.overrides, path);
  return v === null && path[0] !== 'materials' ? undefined : v;
}

/** The value in force at `path` (`['palette', 'dark', 'accent']`), overrides applied. */
export function valueAt(skin: Skin, path: OverridePath): unknown {
  return getIn(resolveSkin(skin).facets, path);
}

/** Renames a skin that is still its pack, so an edited one never passes for the pack itself. */
function asCustom(skin: Skin): Skin {
  if (skin.id !== skin.base) return skin;
  const pack = packs.find((p) => p.id === skin.base);
  return { ...skin, id: `${skin.base}-custom`, label: `${pack?.label ?? skin.base} (custom)` };
}

/** Overrides one value. Setting a value equal to the base's clears the override instead, so a
 *  skin only ever holds what differs. Returns a new skin, in normal form. */
export function setOverride(skin: Skin, path: OverridePath, value: unknown): Skin {
  const base = getIn(baseFacets(skin), path);
  if (value === base || (value === null && base === undefined)) return clearOverride(skin, path);
  return normalizeSkin(asCustom({ ...skin, overrides: setIn(skin.overrides, path, value) as SkinOverrides }));
}

/** Drops the override at `path` (and everything under it). */
export function clearOverride(skin: Skin, path: OverridePath): Skin {
  const parent = getIn(skin.overrides, path.slice(0, -1));
  if (parent === undefined) return normalizeSkin(skin);
  const last = path[path.length - 1];
  let next: unknown;
  if (Array.isArray(parent)) next = parent.map((v, i) => (i === last ? null : v));
  else if (isObj(parent)) {
    const { [String(last)]: _drop, ...rest } = parent;
    next = rest;
  } else return normalizeSkin(skin);
  return normalizeSkin({ ...skin, overrides: setIn(skin.overrides, path.slice(0, -1), next) as SkinOverrides });
}

/** Wears another named facet in place of the pack's (`FROM_THEME` for the pack's own), keeping overrides. */
export function swapFacet(skin: Skin, facet: FacetName, id: string): Skin {
  return normalizeSkin(asCustom({ ...skin, facets: { ...skin.facets, [facet]: id } }));
}

/** Puts one facet back as the pack has it: no swap, no overrides. */
export function resetFacet(skin: Skin, facet: FacetName): Skin {
  const facets = { ...skin.facets };
  delete facets[facet];
  const overrides = { ...skin.overrides };
  delete overrides[facet];
  return normalizeSkin({ ...skin, facets, overrides });
}

/** Moves a skin onto another base pack, keeping its swaps and overrides (the ones the new base
 *  can't wear are dropped, so the result always validates). */
export function rebaseSkin(skin: Skin, packId: string): Skin {
  const fresh = skinFromPack(packId);
  // A skin still named for its pack (or with the name an edit gave it) takes the new pack's name.
  const named = skin.id === skin.base ? fresh : skin.id === `${skin.base}-custom` ? asCustom(fresh) : skin;
  const moved: Skin = { ...skin, base: packId, id: named.id, label: named.label };
  const checked = validateSkin(moved);
  if (checked.ok) return checked.skin;
  return normalizeSkin({ ...moved, overrides: undefined });
}
