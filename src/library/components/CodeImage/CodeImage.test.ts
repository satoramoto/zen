import jsQR from 'jsqr';
import { describe, expect, it } from 'vitest';
import { CODE_IMAGE_MARGIN, CODE_IMAGE_MAX_BYTES, codeImageView, codePath, encodeCode } from './CodeImage.model';

/** The modules as the pixels a camera would see: dark on white with the margin, each module `scale` pixels. */
function pixels(modules: boolean[][], scale = 4): { data: Uint8ClampedArray; side: number } {
  const side = (modules.length + CODE_IMAGE_MARGIN * 2) * scale;
  const data = new Uint8ClampedArray(side * side * 4).fill(255);
  modules.forEach((row, y) =>
    row.forEach((dark, x) => {
      if (!dark) return;
      for (let dy = 0; dy < scale; dy++)
        for (let dx = 0; dx < scale; dx++) {
          const at = (((y + CODE_IMAGE_MARGIN) * scale + dy) * side + (x + CODE_IMAGE_MARGIN) * scale + dx) * 4;
          data[at] = data[at + 1] = data[at + 2] = 0;
        }
    }),
  );
  return { data, side };
}

const read = (text: string) => {
  const modules = encodeCode(text)!;
  const { data, side } = pixels(modules);
  return jsQR(data, side, side)?.data;
};

describe('CodeImage', () => {
  it('reads back a short address', () => {
    const text = 'https://example.com/learn';
    expect(encodeCode(text)!.length).toBe(25); // version 2
    expect(read(text)).toBe(text);
  });

  it('reads back every size it draws', () => {
    for (const bytes of [1, 14, 15, 26, 27, 42, 43, 62, 63, 84, 85, 106, 107, 122, 123, 152, 153, 180, 181, 200, CODE_IMAGE_MAX_BYTES]) {
      const text = `https://e.co/${'abcdefghij'.repeat(22)}`.slice(0, bytes);
      expect(read(text), `${bytes} bytes`).toBe(text);
    }
  });

  it('reads back an address that is not ASCII', () => {
    const text = 'https://example.com/lektion/übung-ø/日本語';
    expect(read(text)).toBe(text);
  });

  it('draws nothing for a text too long, or empty', () => {
    expect(encodeCode('x'.repeat(CODE_IMAGE_MAX_BYTES + 1))).toBeUndefined();
    expect(encodeCode('x'.repeat(300))).toBeUndefined();
    expect(encodeCode('')).toBeUndefined();
    const view = codeImageView({ text: 'x'.repeat(300) }) as { attrs?: Record<string, unknown>; children?: unknown[] };
    expect(JSON.stringify(view)).not.toContain('svg');
  });

  it('draws every dark module once, inside the margin', () => {
    const modules = encodeCode('https://example.com/learn')!;
    const dark = modules.flat().filter(Boolean).length;
    const widths = [...codePath(modules).matchAll(/h(\d+)v1/g)].map((m) => Number(m[1]));
    expect(widths.reduce((a, b) => a + b, 0)).toBe(dark);
    expect(codePath(modules).startsWith(`M${CODE_IMAGE_MARGIN + 0} ${CODE_IMAGE_MARGIN}`)).toBe(true);
  });
});
