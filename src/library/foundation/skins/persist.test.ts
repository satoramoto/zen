import { describe, expect, it } from 'vitest';
import { forgetSkin, loadSkin, saveSkin, type SkinStorage } from './persist';
import { normalizeSkin, skinFromPack, swapFacet, type Skin } from './skin';

function memory(): SkinStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

const broken: SkinStorage = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('quota');
  },
  removeItem: () => {
    throw new Error('blocked');
  },
};

const skin: Skin = {
  ...swapFacet(skinFromPack('linear'), 'faces', 'instrument'),
  overrides: { palette: { dark: { accent: '#ff7a59', hues: [null, '#00aaff'] } }, scale: { control: 32 } },
};

describe('persist', () => {
  it('loads back the skin it saved', () => {
    const store = memory();
    expect(saveSkin('zen.skin', skin, store)).toBe(true);
    expect(loadSkin('zen.skin', store)).toEqual(normalizeSkin(skin));
  });

  it('loads null when nothing is kept', () => {
    expect(loadSkin('zen.skin', memory())).toBeNull();
  });

  it('loads null for text that is not JSON', () => {
    const store = memory();
    store.setItem('zen.skin', '{not json');
    expect(loadSkin('zen.skin', store)).toBeNull();
  });

  it('loads null for JSON that is not a valid skin', () => {
    const store = memory();
    store.setItem('zen.skin', JSON.stringify({ ...skinFromPack('linear'), base: 'nope' }));
    expect(loadSkin('zen.skin', store)).toBeNull();
  });

  it('loads null when reading storage throws', () => {
    expect(loadSkin('zen.skin', broken)).toBeNull();
  });

  it('reports false when storage refuses the write', () => {
    expect(saveSkin('zen.skin', skin, broken)).toBe(false);
  });

  it('forgets a kept skin, and never throws doing so', () => {
    const store = memory();
    saveSkin('zen.skin', skin, store);
    forgetSkin('zen.skin', store);
    expect(loadSkin('zen.skin', store)).toBeNull();
    expect(() => forgetSkin('zen.skin', broken)).not.toThrow();
  });
});
