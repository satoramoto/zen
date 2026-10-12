import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LAYERS, SCOPE_VARS, toCssVars } from '../contract';
import { packs } from '../themes/packs';
import { Hole, Icon, Opaque, STEPS, Stack, Surface, Text } from '.';

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
    const rule = css('Text.css').match(/\.lib-text\[data-role='numeral'\]\)\s*\{([^}]*)\}/);
    expect(rule?.[1]).toMatch(/font-variant-numeric:\s*tabular-nums/);
  });

  it('renders leading, size, weight, case and tabular refinements, an ARIA role and a ref', () => {
    let node: HTMLElement | null = null;
    render(
      <Text
        as="button"
        type="button"
        role="label"
        ariaRole="switch"
        aria-checked="true"
        leading="tight"
        size="caption"
        weight="body"
        case="none"
        tabular={false}
        ref={(el: HTMLElement | null) => {
          node = el;
        }}
      >
        On
      </Text>,
    );
    const el = screen.getByRole('switch', { name: 'On' });
    expect(node).toBe(el);
    expect(el.tagName).toBe('BUTTON');
    expect(el).toHaveAttribute('type', 'button');
    expect(el).toHaveAttribute('data-role', 'label');
    expect(el).toHaveAttribute('data-text-leading', 'tight');
    expect(el).toHaveAttribute('data-text-size', 'caption');
    expect(el).toHaveAttribute('data-text-weight', 'body');
    expect(el).toHaveAttribute('data-text-case', 'none');
    expect(el).toHaveAttribute('data-tabular', 'false');
  });

  it('reads each knob over the role value and resets the knobs on every Text', () => {
    const text = css('Text.css');
    for (const [prop, knob] of [
      ['font-size', '--text-size'],
      ['font-weight', '--text-weight'],
      ['line-height', '--text-leading'],
      ['letter-spacing', '--text-tracking'],
    ]) {
      expect(text).toMatch(new RegExp(`${prop}:\\s*var\\(${knob},\\s*var\\(--lib-text-`));
      expect(text).toMatch(new RegExp(`${knob}:\\s*initial`));
    }
    expect(text).toMatch(/data-text-leading='tight'\]\)\s*\{\s*--lib-text-leading:\s*1;/);
    expect(text).toMatch(/data-text-leading='snug'\]\)\s*\{\s*--lib-text-leading:\s*1\.15;/);
  });
});

describe('primitive specificity', () => {
  // Every rule is :where(), so a component's class on the same element refines it.
  it.each(['Text.css', 'Surface.css'])('%s wraps every selector in :where()', (file) => {
    const src = css(file).replace(/\/\*[\s\S]*?\*\//g, '');
    const selectors = [...src.matchAll(/([^{}]+)\{/g)].flatMap((m) => m[1].split(',').map((s) => s.trim()));
    expect(selectors.length).toBeGreaterThan(10);
    for (const s of selectors) expect(s, file).toMatch(/^:where\(/);
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

  it('can be a control root: native props, a ref and a circle radius', () => {
    let node: HTMLElement | null = null;
    render(
      <Surface
        as="button"
        type="button"
        disabled
        material="key"
        radius="circle"
        aria-label="Play"
        ref={(el: HTMLElement | null) => {
          node = el;
        }}
      />,
    );
    const el = screen.getByRole('button', { name: 'Play' });
    expect(node).toBe(el);
    expect(el).toHaveAttribute('type', 'button');
    expect(el).toBeDisabled();
    expect(el).toHaveAttribute('data-radius', 'circle');
    expect(css('Surface.css')).toMatch(/data-radius='circle'\]\)\s*\{\s*border-radius:\s*50%/);
  });
});

describe('Opaque', () => {
  it('makes every layer inside draw its solid fill and no backdrop', () => {
    // Vitest doesn't load imported CSS, so apply Surface.css itself and read what it computes.
    const style = document.createElement('style');
    style.textContent = css('Surface.css');
    document.head.appendChild(style);
    try {
      const { container } = render(
        <div>
          <Surface layer="base" data-testid="outside" />
          <Opaque>
            <Surface layer="float" data-testid="inside" />
          </Opaque>
        </div>,
      );
      const opaque = container.querySelector('.lib-opaque') as HTMLElement;
      expect(opaque).toContainElement(screen.getByTestId('inside'));
      const computed = getComputedStyle(opaque);
      for (const name of LAYERS) {
        expect(computed.getPropertyValue(`--layer-${name}-fill`).trim(), name).toBe(`var(--layer-${name}-solid)`);
        expect(computed.getPropertyValue(`--layer-${name}-backdrop`).trim(), name).toBe('none');
      }
      // Outside an Opaque scope nothing is swapped.
      expect(getComputedStyle(container.firstElementChild as HTMLElement).getPropertyValue('--layer-base-fill')).toBe('');
      // A layer reads its fill from the swappable variable.
      expect(getComputedStyle(screen.getByTestId('inside')).getPropertyValue('--lib-surface-fill').trim()).toBe('var(--layer-float-fill)');
    } finally {
      style.remove();
    }
  });
});

describe('Hole', () => {
  it('is a cut-out part, a named image only when named', () => {
    render(
      <>
        <Hole className="mine" />
        <Hole name="Preview" />
      </>,
    );
    const plain = document.querySelector('.lib-hole.mine') as HTMLElement;
    expect(plain).toHaveAttribute('data-part', 'hole');
    expect(plain).not.toHaveAttribute('role');
    expect(screen.getByRole('img', { name: 'Preview' })).toHaveClass('lib-hole');
  });
});

describe('Stack', () => {
  it('defaults to a column, gap step 2, no align/justify/wrap, as a div', () => {
    const { container } = render(<Stack>x</Stack>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe('DIV');
    expect(el).toHaveClass('lib-stack');
    expect(el).toHaveAttribute('data-direction', 'column');
    expect(el).toHaveAttribute('data-gap', '2');
    expect(el).not.toHaveAttribute('data-align');
    expect(el).not.toHaveAttribute('data-justify');
    expect(el).not.toHaveAttribute('data-wrap');
  });

  it('renders the given props as attributes, the `as` element, and passes HTML attributes through', () => {
    render(
      <Stack as="ul" direction="row" gap={0} align="baseline" justify="between" wrap className="mine" aria-label="List" data-testid="s">
        <li>a</li>
      </Stack>,
    );
    const el = screen.getByTestId('s');
    expect(el.tagName).toBe('UL');
    expect(el).toHaveClass('lib-stack', 'mine');
    expect(el).toHaveAttribute('aria-label', 'List');
    expect(el).toHaveAttribute('data-direction', 'row');
    expect(el).toHaveAttribute('data-gap', '0');
    expect(el).toHaveAttribute('data-align', 'baseline');
    expect(el).toHaveAttribute('data-justify', 'between');
    expect(el).toHaveAttribute('data-wrap');
  });

  it('Stack.css has a gap rule per step and paints and measures nothing', () => {
    const text = css('Stack.css');
    for (let n = 1; n <= 6; n++) {
      expect(text, `step ${n}`).toMatch(new RegExp(`\\[data-gap='${n}'\\]\\)?\\s*\\{\\s*gap: var\\(--space-${n}\\);`));
    }
    for (const banned of ['px', 'margin', 'background', 'box-shadow', 'border']) {
      expect(text.includes(banned), banned).toBe(false);
    }
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
