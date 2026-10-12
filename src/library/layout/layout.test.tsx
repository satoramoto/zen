import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LAYERS } from '../contract';
import { Group, Layer, Opaque, Region, Stack, Tabs, type TabItem } from '.';

const items: TabItem[] = [
  { id: 'a', label: 'Alpha' },
  { id: 'b', label: 'Beta', disabled: true },
  { id: 'c', label: 'Gamma' },
  { id: 'd', label: 'Delta' },
];

function OwnTabs({ start = 'a' }: { start?: string }) {
  const [value, setValue] = useState<string>(start);
  return <Tabs name="Pages" items={items} value={value} onChange={setValue} />;
}

const tab = (name: string) => screen.getByRole('tab', { name });
const chosen = () => screen.getAllByRole('tab').filter((t) => t.getAttribute('aria-selected') === 'true').map((t) => t.textContent);

describe('Tabs', () => {
  it('arrow keys move the choice, skipping disabled tabs and wrapping, and focus follows', () => {
    render(<OwnTabs />);
    const list = screen.getByRole('tablist', { name: 'Pages' });
    fireEvent.keyDown(list, { key: 'ArrowRight' });
    expect(chosen()).toEqual(['Gamma']);
    expect(tab('Gamma')).toHaveFocus();
    fireEvent.keyDown(list, { key: 'ArrowRight' });
    expect(chosen()).toEqual(['Delta']);
    fireEvent.keyDown(list, { key: 'ArrowRight' });
    expect(chosen()).toEqual(['Alpha']);
    fireEvent.keyDown(list, { key: 'ArrowLeft' });
    expect(chosen()).toEqual(['Delta']);
    expect(tab('Delta')).toHaveFocus();
  });

  it('Home and End jump to the first and last enabled tabs', () => {
    render(<OwnTabs start="c" />);
    const list = screen.getByRole('tablist');
    fireEvent.keyDown(list, { key: 'End' });
    expect(chosen()).toEqual(['Delta']);
    fireEvent.keyDown(list, { key: 'Home' });
    expect(chosen()).toEqual(['Alpha']);
  });

  it('is controlled: shows `value`, asks onChange, and gives the tab stop to the chosen tab', () => {
    const onChange = vi.fn();
    const { rerender } = render(<Tabs name="Pages" items={items} value="c" onChange={onChange} />);
    expect(chosen()).toEqual(['Gamma']);
    expect(tab('Gamma')).toHaveAttribute('tabindex', '0');
    expect(tab('Alpha')).toHaveAttribute('tabindex', '-1');
    fireEvent.click(tab('Delta'));
    expect(onChange).toHaveBeenCalledWith('d');
    expect(chosen()).toEqual(['Gamma']); // not changed until the caller says so
    fireEvent.click(tab('Beta')); // disabled
    expect(onChange).toHaveBeenCalledTimes(1);
    rerender(<Tabs name="Pages" items={items} value="d" onChange={onChange} />);
    expect(chosen()).toEqual(['Delta']);
  });
});

function MixerRegion(props: { view?: string; defaultView?: string; onView?: (id: string) => void }) {
  return (
    <Region name="Mixer" {...props}>
      <Region.View id="levels" label="Levels">
        <p>levels body</p>
      </Region.View>
      <Region.View id="sends" label="Sends">
        <p>sends body</p>
      </Region.View>
    </Region>
  );
}

describe('Region', () => {
  it('shows a tab per view and the chosen view as the tab panel; its tabs switch views', () => {
    render(<MixerRegion />);
    const region = screen.getByRole('region', { name: 'Mixer' });
    expect(screen.getByRole('tablist', { name: 'Mixer' })).toBeInTheDocument();
    const panel = screen.getByRole('tabpanel');
    expect(region).toContainElement(panel);
    expect(panel).toHaveTextContent('levels body');
    expect(panel).toHaveAttribute('aria-labelledby', tab('Levels').id);
    expect(screen.queryByText('sends body')).toBeNull();

    fireEvent.click(tab('Sends'));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('sends body');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', tab('Sends').id);
    expect(screen.queryByText('levels body')).toBeNull();
  });

  it('starts on defaultView when uncontrolled', () => {
    render(<MixerRegion defaultView="sends" />);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('sends body');
  });

  it('with `view`, the choice is the caller\'s: tabs ask onView and the region follows the prop', () => {
    const onView = vi.fn();
    const { rerender } = render(<MixerRegion view="levels" onView={onView} />);
    fireEvent.click(tab('Sends'));
    expect(onView).toHaveBeenCalledWith('sends');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('levels body');
    rerender(<MixerRegion view="sends" onView={onView} />);
    expect(screen.getByRole('tabpanel')).toHaveTextContent('sends body');
    expect(chosen()).toEqual(['Sends']);
  });

  it('without views it renders plain content and no tabs', () => {
    render(
      <Region name="Pads">
        <p>pads</p>
      </Region>,
    );
    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.queryByRole('tabpanel')).toBeNull();
    expect(screen.getByRole('region', { name: 'Pads' })).toHaveTextContent('pads');
  });
});

describe('Opaque', () => {
  // Vitest doesn't load imported CSS, so apply Layer.css itself and read what it computes.
  const css = readFileSync(join(process.cwd(), 'src/library/layout/Layer.css'), 'utf8');

  it('makes every layer inside draw its solid fill and no backdrop', () => {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    try {
      const { container } = render(
        <div>
          <Layer level="base" data-testid="outside" />
          <Opaque>
            <Layer level="float" data-testid="inside" />
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
      expect(getComputedStyle(screen.getByTestId('inside')).getPropertyValue('--lib-layer-fill').trim()).toBe('var(--layer-float-fill)');
    } finally {
      style.remove();
    }
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
    const css = readFileSync(join(process.cwd(), 'src/library/layout/Stack.css'), 'utf8');
    for (let n = 1; n <= 6; n++) {
      expect(css, `step ${n}`).toMatch(new RegExp(`\\[data-gap='${n}'\\]\\)?\\s*\\{\\s*gap: var\\(--space-${n}\\);`));
    }
    for (const banned of ['px', 'margin', 'background', 'box-shadow', 'border']) {
      expect(css.includes(banned), banned).toBe(false);
    }
  });
});

describe('Group spacing', () => {
  const body = () => screen.getByRole('group', { name: 'Keys' }).querySelector('[data-part="body"]') as HTMLElement;

  it('its body is a Stack: a row, gap step 2 by default', () => {
    render(
      <Group name="Keys">
        <span>a</span>
      </Group>,
    );
    expect(body()).toHaveClass('lib-group__body', 'lib-stack');
    expect(body()).toHaveAttribute('data-direction', 'row');
    expect(body()).toHaveAttribute('data-gap', '2');
    expect(body()).not.toHaveAttribute('data-align');
    expect(body()).not.toHaveAttribute('data-wrap');
  });

  it('forwards gap, align, direction and wrap to its body', () => {
    render(
      <Group name="Keys" gap={5} align="center" direction="column" wrap>
        <span>a</span>
      </Group>,
    );
    expect(body()).toHaveAttribute('data-gap', '5');
    expect(body()).toHaveAttribute('data-align', 'center');
    expect(body()).toHaveAttribute('data-direction', 'column');
    expect(body()).toHaveAttribute('data-wrap');
  });
});

describe('Region spacing', () => {
  const body = () => screen.getByRole('region', { name: 'Pads' }).querySelector('[data-part="body"]') as HTMLElement;

  it('puts data-gap on its body only when given', () => {
    const { rerender } = render(<Region name="Pads">x</Region>);
    expect(body()).not.toHaveAttribute('data-gap');
    rerender(
      <Region name="Pads" gap={4}>
        x
      </Region>,
    );
    expect(body()).toHaveAttribute('data-gap', '4');
    expect(screen.getByRole('region', { name: 'Pads' })).not.toHaveAttribute('data-gap');
  });

  it('Region.css has a body gap rule per step', () => {
    const css = readFileSync(join(process.cwd(), 'src/library/layout/Region.css'), 'utf8');
    for (let n = 1; n <= 6; n++) {
      expect(css, `step ${n}`).toContain(`.lib-region__body[data-gap='${n}'] { gap: var(--space-${n}); }`);
    }
  });
});
