import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SCOPE_VARS, toCssVars } from '../contract';
import { packs } from '../themes/packs';
import { Icon, STEPS, Surface, Text } from '.';

const dir = join(process.cwd(), 'src/library/primitives');
const css = (name: string) => readFileSync(join(dir, name), 'utf8');
const cssFiles = readdirSync(dir).filter((f) => f.endsWith('.css'));

describe('Text', () => {
  it('renders its role and tone as data attributes, on the element `as` names', () => {
    render(
      <Text role="numeral" tone={2} as="p">
        128
      </Text>,
    );
    const el = screen.getByText('128');
    expect(el.tagName).toBe('P');
    expect(el).toHaveAttribute('data-role', 'numeral');
    expect(el).toHaveAttribute('data-tone', 'hue-2');
  });

  it('defaults to a body span with no tone, and passes attributes through', () => {
    render(<Text id="t" truncate>plain</Text>);
    const el = screen.getByText('plain');
    expect(el.tagName).toBe('SPAN');
    expect(el).toHaveAttribute('data-role', 'body');
    expect(el).not.toHaveAttribute('data-tone');
    expect(el).toHaveAttribute('data-truncate');
    expect(el).toHaveAttribute('id', 't');
  });

  it('sets tabular figures for numerals in its CSS', () => {
    const rule = css('Text.css').match(/\.lib-text\[data-role='numeral'\]\s*\{([^}]*)\}/);
    expect(rule?.[1]).toMatch(/font-variant-numeric:\s*tabular-nums/);
  });
});

describe('Surface', () => {
  it('renders layer, material, pressed, lit and border as data attributes', () => {
    render(<Surface layer="float" material="key" pressed lit={3} border="strong" data-testid="s" />);
    const el = screen.getByTestId('s');
    expect(el).toHaveAttribute('data-layer', 'float');
    expect(el).toHaveAttribute('data-material', 'key');
    expect(el).toHaveAttribute('data-pressed');
    expect(el).toHaveAttribute('data-lit', 'hue-3');
    expect(el).toHaveAttribute('data-border', 'strong');
  });

  it('defaults the radius to card for a bare layer and control otherwise', () => {
    render(
      <>
        <Surface layer="base" data-testid="layer" />
        <Surface layer="base" material="well" data-testid="both" />
        <Surface material="handle" data-testid="mat" />
        <Surface layer="base" radius="none" data-testid="none" />
      </>,
    );
    expect(screen.getByTestId('layer')).toHaveAttribute('data-radius', 'card');
    expect(screen.getByTestId('both')).toHaveAttribute('data-radius', 'control');
    expect(screen.getByTestId('mat')).toHaveAttribute('data-radius', 'control');
    expect(screen.getByTestId('none')).toHaveAttribute('data-radius', 'none');
    expect(screen.getByTestId('mat')).not.toHaveAttribute('data-pressed');
    expect(screen.getByTestId('mat')).not.toHaveAttribute('data-lit');
  });
});

describe('Icon', () => {
  it('is hidden from assistive tech without a label', () => {
    const { container } = render(<Icon><path d="M0 0h24" /></Icon>);
    const root = container.firstElementChild!;
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root).not.toHaveAttribute('role');
  });

  it('is a named image with a label', () => {
    render(<Icon label="Play" size="control"><path d="M0 0h24" /></Icon>);
    const img = screen.getByRole('img', { name: 'Play' });
    expect(img).not.toHaveAttribute('aria-hidden');
    expect(img).toHaveAttribute('data-size', 'control');
  });
});

describe('step', () => {
  it('has a no-gap step and one per contract spacing variable', () => {
    const spaces = Object.keys(toCssVars(packs[0].facets, 'dark')).filter((k) => /^--space-\d+$/.test(k));
    expect(STEPS).toEqual([0, ...spaces.map((_, i) => i + 1)]);
  });
});

describe('primitives CSS', () => {
  const contract = new Set([...Object.keys(toCssVars(packs[0].facets, 'dark')), ...SCOPE_VARS]);
  const all = cssFiles.map(css).join('\n');
  const declared = new Set([...all.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));

  it('reads only contract variables or ones it declares', () => {
    const read = [...all.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]);
    expect(read.length).toBeGreaterThan(0);
    const unknown = read.filter((v) => !contract.has(v) && !declared.has(v));
    expect(unknown).toEqual([]);
  });

  it('has no colour literals and no light-dark()', () => {
    for (const file of cssFiles) {
      const text = css(file).replace(/\/\*[\s\S]*?\*\//g, '');
      expect(text, file).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(text, file).not.toMatch(/\b(rgba?|hsla?|oklch|oklab|lab|lch)\(/);
      expect(text, file).not.toMatch(/light-dark\(/);
    }
  });
});
