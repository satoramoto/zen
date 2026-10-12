import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { LAYERS } from '../contract';
import { Layer, Opaque, Region, Tabs, type TabItem } from '.';

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
