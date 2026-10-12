import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { useState, type ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Group, Layer, Region, Tabs, type TabItem } from '.';

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

describe('Layer (deprecated alias of Surface)', () => {
  it('renders a Surface at the level, with card corners, keeping the lib-layer class', () => {
    render(
      <Layer level="float" className="mine" role="dialog" id="l" aria-label="Pop" data-testid="l">
        x
      </Layer>,
    );
    const el = screen.getByTestId('l');
    expect(el.tagName).toBe('DIV');
    expect(el).toHaveClass('lib-surface', 'lib-layer', 'mine');
    expect(el).toHaveAttribute('data-layer', 'float');
    expect(el).toHaveAttribute('data-radius', 'card');
    expect(el).toHaveAttribute('role', 'dialog');
    expect(el).toHaveAttribute('id', 'l');
    expect(el).toHaveAttribute('aria-label', 'Pop');
    expect(el).toHaveTextContent('x');
  });

  it('renders the element `as` names, a component included', () => {
    function Box({ className, children, ...rest }: { className?: string; children?: ReactNode }) {
      return (
        <section className={`box ${className ?? ''}`} {...rest}>
          {children}
        </section>
      );
    }
    render(
      <>
        <Layer level="base" as="aside" data-testid="a" />
        <Layer level="top" as={Box} data-testid="b" />
      </>,
    );
    expect(screen.getByTestId('a').tagName).toBe('ASIDE');
    const b = screen.getByTestId('b');
    expect(b.tagName).toBe('SECTION');
    expect(b).toHaveClass('box', 'lib-surface', 'lib-layer');
    expect(b).toHaveAttribute('data-layer', 'top');
  });
});

describe('Group', () => {
  it('its root is a Stack: a column, gap step 1, named as a group', () => {
    render(
      <Group name="Keys" area="keys" className="mine">
        <span>a</span>
      </Group>,
    );
    const root = screen.getByRole('group', { name: 'Keys' });
    expect(root).toHaveClass('lib-stack', 'lib-group', 'mine');
    expect(root).toHaveAttribute('data-part', 'group');
    expect(root).toHaveAttribute('data-direction', 'column');
    expect(root).toHaveAttribute('data-gap', '1');
    expect(root.style.gridArea).toContain('keys');
    expect(root.querySelector(':scope > .lib-group__head > .lib-group__label')).toHaveTextContent('Keys');
    expect(root.querySelector(':scope > .lib-group__body')).not.toBeNull();
  });

  it('Group.css keeps no grid of its own', () => {
    const css = readFileSync(join(process.cwd(), 'src/library/layout/Group.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).not.toMatch(/display:\s*grid|grid-template/);
    expect(css).not.toMatch(/\.lib-group\s*\{/);
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
