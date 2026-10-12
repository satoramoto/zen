import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Device, DevicePortRow } from './Device';

const part = (root: Element, name: string) => root.querySelector(`[data-part="${name}"]`);

describe('Device', () => {
  it('draws its parts: root, head, name, head-end, screen, rows, body', () => {
    const { container } = render(
      <Device
        name="Warp"
        headerEnd={<button type="button">×</button>}
        screen={<div>picture</div>}
        portRows={<DevicePortRow inlet={<button type="button">in</button>}>Mesh</DevicePortRow>}
      >
        <p>code</p>
      </Device>,
    );
    const root = part(container, 'root')!;
    expect(root).toHaveClass('lib-device', 'lib-surface');
    expect(root).toHaveAttribute('data-layer', 'raised');
    for (const p of ['head', 'name', 'head-end', 'screen', 'rows', 'row', 'body']) expect(part(root, p), p).not.toBeNull();
    expect(part(root, 'name')).toHaveTextContent('Warp');
    expect(part(root, 'body')).toHaveTextContent('code');
    expect(part(root, 'rails')).toBeNull();
  });

  it('a plain device has a head and a body, and no screen, rows or rails', () => {
    const { container } = render(<Device name="Comp">body</Device>);
    const root = part(container, 'root')!;
    expect(part(root, 'body')).toHaveTextContent('body');
    for (const p of ['head-end', 'screen', 'rows', 'rails']) expect(part(root, p), p).toBeNull();
  });

  it('inlets and outlets put the body between two rails', () => {
    const { container } = render(
      <Device name="Mix" inlets={<button type="button">a</button>} outlets={<button type="button">b</button>}>
        body
      </Device>,
    );
    const rails = part(container, 'rails')!;
    expect([...rails.children].map((c) => c.getAttribute('data-part'))).toEqual(['rail-in', 'body', 'rail-out']);
    expect(part(rails, 'rail-in')).toHaveTextContent('a');
    expect(part(rails, 'rail-out')).toHaveTextContent('b');
  });

  it('the title is the head tooltip', () => {
    const { container } = render(<Device name="Warp" title="Warps the picture" />);
    expect(part(container, 'head')).toHaveAttribute('title', 'Warps the picture');
  });

  it('clicking the head selects; Enter and Space on the name select', async () => {
    const onSelect = vi.fn();
    const { container } = render(<Device name="Warp" onSelect={onSelect} />);
    await userEvent.click(part(container, 'head')!);
    expect(onSelect).toHaveBeenCalledTimes(1);
    const name = screen.getByRole('button', { name: 'Warp' });
    expect(name).toHaveAttribute('data-part', 'name');
    expect(name).toHaveAttribute('tabindex', '0');
    await userEvent.click(name);
    expect(onSelect).toHaveBeenCalledTimes(2);
    name.focus();
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledTimes(3);
    await userEvent.keyboard(' ');
    expect(onSelect).toHaveBeenCalledTimes(4);
    fireEvent.keyDown(name, { key: 'a' });
    expect(onSelect).toHaveBeenCalledTimes(4);
  });

  it('a click on a head action is not a select', async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(
      <Device
        name="Warp"
        onSelect={onSelect}
        headerEnd={
          <button type="button" aria-label="Remove" onClick={onClose}>
            ×
          </button>
        }
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('without onSelect the name is no tab stop and no button', () => {
    const { container } = render(<Device name="Warp" />);
    const name = part(container, 'name')!;
    expect(name).not.toHaveAttribute('tabindex');
    expect(name).not.toHaveAttribute('role');
  });

  it('selected and problem show on the root, and selected presses the name', () => {
    const { container, rerender } = render(<Device name="Warp" onSelect={() => {}} />);
    const root = part(container, 'root')!;
    expect(root).not.toHaveAttribute('data-selected');
    expect(root).not.toHaveAttribute('data-problem');
    expect(screen.getByRole('button', { name: 'Warp' })).toHaveAttribute('aria-pressed', 'false');
    rerender(<Device name="Warp" onSelect={() => {}} selected problem />);
    expect(root).toHaveAttribute('data-selected', '');
    expect(root).toHaveAttribute('data-problem', '');
    expect(screen.getByRole('button', { name: 'Warp' })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('DevicePortRow', () => {
  it('puts the inlet at the start, the child in the middle and the outlet at the end', () => {
    const { container } = render(
      <DevicePortRow inlet={<button type="button">in</button>} outlet={<button type="button">out</button>}>
        Mesh
      </DevicePortRow>,
    );
    const row = part(container, 'row')!;
    expect([...row.children].map((c) => c.getAttribute('data-part'))).toEqual(['row-in', 'row-control', 'row-out']);
    expect(row.children[0]).toHaveAttribute('data-side', 'in');
    expect(row.children[0]).toHaveTextContent('in');
    expect(row.children[1]).toHaveTextContent('Mesh');
    expect(row.children[1].firstElementChild).toHaveAttribute('data-role', 'caption');
    expect(row.children[2]).toHaveAttribute('data-side', 'out');
    expect(row.children[2]).toHaveTextContent('out');
  });

  it('keeps an empty port cell, so the child stays in the middle column', () => {
    const { container } = render(<DevicePortRow outlet={<button type="button">out</button>}>Mesh</DevicePortRow>);
    const row = part(container, 'row')!;
    expect(row.children).toHaveLength(3);
    expect(row.children[0]).toBeEmptyDOMElement();
  });
});
