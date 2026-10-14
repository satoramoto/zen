import { describe, expect, it } from 'vitest';
import { packs } from '../themes/packs';
import { FROM_THEME } from '../resolve';
import {
  applyOverrides,
  baseFacets,
  clearOverride,
  isCustom,
  normalizeSkin,
  parseSkin,
  rebaseSkin,
  resetFacet,
  resolveSkin,
  serializeSkin,
  setOverride,
  skinFromPack,
  swapFacet,
  validateSkin,
  type Skin,
} from './skin';

const linear = () => skinFromPack('linear');
const visuals = packs.find((p) => p.id === 'visuals')!;

/** The errors validateSkin gives for a value, or [] when it passes. */
const errorsOf = (value: unknown) => {
  const r = validateSkin(value);
  return r.ok ? [] : r.errors;
};
const withOverrides = (overrides: unknown, extra: object = {}) => ({ ...linear(), ...extra, overrides });

describe('skinFromPack', () => {
  it('makes the same skin from a pack or its id', () => {
    expect(skinFromPack(packs[2])).toEqual(skinFromPack(packs[2].id));
  });

  it('throws for an unknown id', () => {
    expect(() => skinFromPack('nope')).toThrow(/nope/);
  });

  for (const pack of packs)
    it(`resolves ${pack.id} to exactly the pack's facets, and is not custom`, () => {
      const skin = skinFromPack(pack);
      expect(resolveSkin(skin).facets).toEqual(pack.facets);
      expect(resolveSkin(skin).pack.desktop).toEqual(pack.desktop);
      expect(isCustom(skin)).toBe(false);
    });
});

describe('applyOverrides', () => {
  const facets = baseFacets({ base: 'visuals' });
  const before = structuredClone(facets);

  it('changes only the mode a palette override names', () => {
    const out = applyOverrides(facets, { palette: { dark: { accent: '#ff7a59' } } });
    expect(out.palette.dark.accent).toBe('#ff7a59');
    expect(out.palette.dark.text).toEqual(facets.palette.dark.text);
    expect(out.palette.light).toEqual(facets.palette.light);
  });

  it('keeps the base where an array override holds null', () => {
    const out = applyOverrides(facets, { palette: { light: { hues: [null, '#00aaff'] } } });
    expect(out.palette.light.hues).toEqual([facets.palette.light.hues[0], '#00aaff', ...facets.palette.light.hues.slice(2)]);
  });

  it('overrides scalars in faces, scale and materials', () => {
    const out = applyOverrides(facets, { faces: { labelCase: 'uppercase' }, scale: { control: 40, sizes: { body: 15 } }, materials: { input: 'box' } });
    expect(out.faces.labelCase).toBe('uppercase');
    expect(out.faces.sans).toBe(facets.faces.sans);
    expect(out.scale.control).toBe(40);
    expect(out.scale.sizes).toEqual({ ...facets.scale.sizes, body: 15 });
    expect(out.materials.input).toBe('box');
  });

  it("drops a layer's shader set to null, keeping the others", () => {
    expect(facets.materials.shaders?.float).toBe('glass');
    const out = applyOverrides(facets, { materials: { shaders: { float: null, base: 'water' } } });
    expect(out.materials.shaders).toEqual({ ...facets.materials.shaders, float: undefined, base: 'water' });
    expect('float' in out.materials.shaders!).toBe(false);
  });

  it('leaves the facets passed in unchanged', () => {
    applyOverrides(facets, {
      palette: { dark: { accent: '#ff7a59', hues: [null, '#00aaff'] } },
      scale: { sizes: { body: 15 } },
      materials: { shaders: { float: null } },
    });
    expect(facets).toEqual(before);
  });
});

describe('validateSkin', () => {
  for (const pack of packs)
    it(`accepts the ${pack.id} pack as a skin`, () => {
      expect(validateSkin(skinFromPack(pack))).toEqual({ ok: true, skin: skinFromPack(pack) });
    });

  it('accepts a skin with swaps and overrides', () => {
    expect(errorsOf({ ...swapFacet(linear(), 'faces', 'instrument'), overrides: { scale: { control: 40 }, materials: { shaders: { top: null } } } })).toEqual([]);
  });

  it('refuses anything that is not an object', () => {
    expect(errorsOf([])).toEqual(['A skin is a JSON object']);
    expect(errorsOf('skin')).toEqual(['A skin is a JSON object']);
  });

  // Each case: a bad skin and the start of the message that must name what is wrong.
  const cases: [string, unknown, string][] = [
    ['a wrong format', { ...linear(), format: 'zen-theme' }, 'format:'],
    ['a wrong version', { ...linear(), version: 2 }, 'version:'],
    ['an unknown base', { ...linear(), base: 'nope' }, "base: no theme pack 'nope'"],
    ['an unknown facet id', { ...linear(), facets: { faces: 'nope' } }, "facets.faces: no faces 'nope'"],
    ['an unknown facet name', { ...linear(), facets: { colours: 'push' } }, 'facets.colours: not a facet'],
    ['an extra top-level key', { ...linear(), theme: 'linear' }, 'theme: not part of a skin'],
    ['an override of an unknown facet', withOverrides({ colours: {} }), 'overrides.colours: not a facet'],
    ['an unknown override key', withOverrides({ scale: { gutter: 4 } }), 'overrides.scale.gutter: not part of the contract'],
    ['an unknown nested key', withOverrides({ scale: { sizes: { huge: 40 } } }), 'overrides.scale.sizes.huge: not part of the contract'],
    ["a facet's id", withOverrides({ faces: { id: 'mine' } }), 'overrides.faces.id:'],
    ["a facet's label", withOverrides({ materials: { label: 'Mine' } }), 'overrides.materials.label:'],
    ['palette overrides outside a mode', withOverrides({ palette: { accent: '#ffffff' } }), 'overrides.palette.accent:'],
    ['text where a number goes', withOverrides({ scale: { control: '32' } }), 'overrides.scale.control: expected a number'],
    ['a number where text goes', withOverrides({ faces: { sans: 12 } }), 'overrides.faces.sans: expected text'],
    ['a colour that is not #rrggbb', withOverrides({ palette: { dark: { accent: 'red' } } }), 'overrides.palette.dark.accent: a colour as #rrggbb'],
    ['a short hex colour', withOverrides({ palette: { light: { hues: [null, '#fff'] } } }), 'overrides.palette.light.hues.1: a colour as #rrggbb'],
    ['a labelCase outside the enum', withOverrides({ faces: { labelCase: 'lowercase' } }), 'overrides.faces.labelCase: one of none, uppercase'],
    ['an input outside the enum', withOverrides({ materials: { input: 'outline' } }), 'overrides.materials.input: one of filled, box, underline'],
    ['a control height out of range', withOverrides({ scale: { control: 500 } }), 'overrides.scale.control: 500 is outside 12–96'],
    ['a type size out of range', withOverrides({ scale: { sizes: { body: 2 } } }), 'overrides.scale.sizes.body: 2 is outside'],
    ['an unknown shader', withOverrides({ materials: { shaders: { float: 'fire' } } }), 'overrides.materials.shaders.float: one of water, ether, glass or null'],
    ['a shader on an unknown layer', withOverrides({ materials: { shaders: { basement: 'glass' } } }), 'overrides.materials.shaders.basement: not a layer'],
    ['too many hues', withOverrides({ palette: { dark: { hues: ['#000000', '#111111', '#222222', '#333333', '#444444'] } } }), 'overrides.palette.dark.hues: at most 4 entries'],
    ['a list where an object goes', withOverrides({ scale: { sizes: [10] } }), 'overrides.scale.sizes: expected an object'],
    ['CSS fetching from the network', withOverrides({ faces: { sans: 'x, url(https://example.com/f.woff2)' } }), 'overrides.faces.sans: may only use data: URLs'],
    ['CSS fetching through a quoted url', withOverrides({ faces: { sans: 'x, url( "//example.com/f.woff2")' } }), 'overrides.faces.sans: may only use data: URLs'],
    ['CSS with @import', withOverrides({ faces: { sans: '@import "x.css"' } }), 'overrides.faces.sans: may not contain'],
    ['CSS that ends a declaration', withOverrides({ materials: { radiusCard: '4px; background: red' } }), 'overrides.materials.radiusCard: may not contain'],
  ];

  for (const [what, value, message] of cases)
    it(`refuses ${what}, naming the path`, () => {
      const errors = errorsOf(value);
      expect(errors.some((e) => e.startsWith(message)), `got ${JSON.stringify(errors)}`).toBe(true);
    });

  it('accepts CSS with a data: URL', () => {
    expect(errorsOf(withOverrides({ faces: { sans: 'x, url("data:image/svg+xml,%3Csvg%3E")' } }))).toEqual([]);
    expect(errorsOf(withOverrides({ materials: { well: { texture: 'url(data:image/png;base64,iVBORw0KGgo=)' } } }))).toEqual([]);
    expect(errorsOf(withOverrides({ materials: { well: { texture: 'url(data:image/png;base64,AA==); x' } } })).length).toBeGreaterThan(0);
  });

  it('checks overrides against the swapped facet, not the pack', () => {
    expect(errorsOf({ ...linear(), facets: { palette: 'frost' }, overrides: { palette: { dark: { accent: 'blue' } } } })).toEqual([
      'overrides.palette.dark.accent: a colour as #rrggbb',
    ]);
  });

  it('comes back in normal form', () => {
    const r = validateSkin({ ...linear(), facets: { faces: FROM_THEME }, overrides: { scale: {} } });
    expect(r).toEqual({ ok: true, skin: linear() });
  });
});

describe('serializeSkin and parseSkin', () => {
  const skin: Skin = {
    format: 'zen-skin',
    version: 1,
    id: 'glass-mine',
    label: 'My glass',
    base: 'visuals',
    facets: { faces: 'linear', palette: FROM_THEME },
    overrides: {
      materials: { shaders: { float: null, base: 'water' }, input: 'box' },
      palette: { dark: { hues: [null, '#ff0000', null], accent: '#ff7a59' }, light: { surface: [null, null, '#eeeeee'] } },
      faces: { labelCase: 'uppercase' },
      scale: { sizes: { body: 15 }, control: 40 },
    },
  };

  it('round-trips to the normal form, and serializes stably', () => {
    const text = serializeSkin(skin);
    const read = parseSkin(text);
    expect(read).toEqual({ ok: true, skin: normalizeSkin(skin) });
    if (read.ok) expect(serializeSkin(read.skin)).toBe(text);
  });

  it('keeps holes in the middle of a list and the null that drops a shader', () => {
    const read = parseSkin(serializeSkin(skin));
    if (!read.ok) throw new Error(read.errors.join('\n'));
    expect(read.skin.overrides?.palette?.light?.surface).toEqual([null, null, '#eeeeee']);
    expect(read.skin.overrides?.materials?.shaders).toEqual({ base: 'water', float: null });
    expect(resolveSkin(read.skin).facets).toEqual(resolveSkin(skin).facets);
  });

  it('serializes equal skins alike, whatever their key order', () => {
    const reordered: Skin = {
      ...skin,
      overrides: { scale: { control: 40, sizes: { body: 15 } }, faces: { labelCase: 'uppercase' }, palette: skin.overrides!.palette, materials: skin.overrides!.materials },
    };
    expect(serializeSkin(reordered)).toBe(serializeSkin(skin));
  });

  it('says text that is not JSON is not JSON', () => {
    const read = parseSkin('{"format": ');
    expect(read.ok).toBe(false);
    if (!read.ok) expect(read.errors[0]).toMatch(/^Not JSON/);
  });

  it('drops empty objects, swaps back to the pack and trailing nulls', () => {
    const n = normalizeSkin({
      ...linear(),
      facets: { palette: FROM_THEME, faces: FROM_THEME },
      overrides: { faces: {}, palette: { dark: { hues: [null, '#ff0000', null, null] }, light: {} }, scale: { sizes: {} }, materials: { shaders: {} } },
    });
    expect(n).toEqual({ ...linear(), overrides: { palette: { dark: { hues: [null, '#ff0000'] } } } });
    expect(normalizeSkin({ ...linear(), facets: { faces: FROM_THEME }, overrides: { palette: { dark: { hues: [null, null] } } } })).toEqual(linear());
  });
});

describe('editing', () => {
  const base = baseFacets({ base: 'linear' });

  it('renames a pack on its first edit', () => {
    const edited = setOverride(linear(), ['scale', 'control'], 40);
    expect(edited).toMatchObject({ id: 'linear-custom', label: 'Linear (custom)', base: 'linear', overrides: { scale: { control: 40 } } });
    expect(isCustom(edited)).toBe(true);
  });

  it('keeps a name the skin already has', () => {
    const named = { ...linear(), id: 'mine', label: 'Mine' };
    expect(setOverride(named, ['scale', 'control'], 40)).toMatchObject({ id: 'mine', label: 'Mine' });
  });

  it('clears an override set back to the base value', () => {
    const edited = setOverride(linear(), ['scale', 'control'], 40);
    const back = setOverride(edited, ['scale', 'control'], base.scale.control);
    expect(back.overrides).toBeUndefined();
    expect(isCustom(back)).toBe(false);
  });

  it('does not rename or override for a value already equal to the base', () => {
    expect(setOverride(linear(), ['palette', 'dark', 'accent'], base.palette.dark.accent)).toEqual(linear());
  });

  it('sets and clears single entries of a list', () => {
    let s = setOverride(linear(), ['palette', 'dark', 'hues', 2], '#00aaff');
    expect(s.overrides?.palette?.dark?.hues).toEqual([null, null, '#00aaff']);
    s = setOverride(s, ['palette', 'dark', 'hues', 0], '#ff0000');
    s = clearOverride(s, ['palette', 'dark', 'hues', 2]);
    expect(s.overrides?.palette?.dark?.hues).toEqual(['#ff0000']);
    s = clearOverride(s, ['palette', 'dark', 'hues', 0]);
    expect(s.overrides).toBeUndefined();
  });

  it('clears a whole branch', () => {
    const s = setOverride(setOverride(linear(), ['scale', 'sizes', 'body'], 15), ['scale', 'control'], 40);
    expect(clearOverride(s, ['scale', 'sizes']).overrides).toEqual({ scale: { control: 40 } });
  });

  it('swaps a facet, and swaps it back to the pack', () => {
    const swapped = swapFacet(linear(), 'faces', 'instrument');
    expect(swapped).toMatchObject({ id: 'linear-custom', facets: { faces: 'instrument' } });
    expect(resolveSkin(swapped).facets.faces.id).toBe('instrument');
    expect(swapFacet(swapped, 'faces', FROM_THEME).facets).toBeUndefined();
  });

  it('resets one facet, dropping its swap and overrides only', () => {
    let s = swapFacet(linear(), 'faces', 'instrument');
    s = setOverride(s, ['faces', 'labelCase'], 'uppercase');
    s = setOverride(s, ['scale', 'control'], 40);
    const reset = resetFacet(s, 'faces');
    expect(reset.facets).toBeUndefined();
    expect(reset.overrides).toEqual({ scale: { control: 40 } });
  });

  it('rebases a pack-named skin onto the new pack, keeping overrides', () => {
    const s = setOverride(linear(), ['scale', 'control'], 40);
    const moved = rebaseSkin(s, 'ableton');
    expect(moved).toMatchObject({ id: 'ableton-custom', label: 'Ableton (custom)', base: 'ableton', overrides: { scale: { control: 40 } } });
    expect(rebaseSkin(linear(), 'ableton')).toEqual(skinFromPack('ableton'));
  });

  it('rebases a skin with its own name without renaming it', () => {
    const s = { ...setOverride(linear(), ['scale', 'control'], 40), id: 'mine', label: 'Mine' };
    expect(rebaseSkin(s, 'ableton')).toMatchObject({ id: 'mine', label: 'Mine', base: 'ableton' });
  });

  it('rebases a skin with swaps onto a pack that keeps them', () => {
    const s = setOverride(swapFacet(linear(), 'materials', 'frost'), ['materials', 'shaders', 'float'], null);
    const moved = rebaseSkin(s, visuals.id);
    expect(moved).toMatchObject({ id: 'visuals-custom', facets: { materials: 'frost' }, overrides: { materials: { shaders: { float: null } } } });
    expect(validateSkin(moved).ok).toBe(true);
  });
});
