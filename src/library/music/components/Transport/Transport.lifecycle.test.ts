// @vitest-environment jsdom
// Binding lifecycle only. Rendered UI and commands are exercised by Transport.stories.tsx.
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { bindTransportPosition } from './Transport.input';

beforeEach(() => {
  // Node's native localStorage shadows jsdom's in this environment; use an explicit preference host.
  const kept = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => kept.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { kept.set(key, value); }),
  });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.replaceChildren(); });

it('restores once, keeps the unit across updates/optional-button removal, and removes its listener', () => {
  const root = document.createElement('div');
  const button = document.createElement('button');
  button.className = 'wdg-transport-position';
  root.append(button);
  document.body.append(root);
  localStorage.setItem('transport-before', 'seconds');
  const onUnit = vi.fn(), updated = vi.fn();
  const binding = bindTransportPosition(root, { remember: 'transport-before', onUnit });
  expect(onUnit).toHaveBeenCalledWith('seconds');
  button.remove();
  binding.update({ remember: 'transport-after', onUnit: updated });
  root.append(button);
  button.click();
  expect(updated).toHaveBeenLastCalledWith('beats');
  expect(localStorage.getItem('transport-before')).toBe('seconds');
  expect(localStorage.getItem('transport-after')).toBe('beats');
  binding.destroy();
  button.click();
  expect(updated).toHaveBeenCalledOnce();
});

it('still switches when preference reads/writes are blocked and ignores nested transports', () => {
  vi.mocked(localStorage.getItem).mockImplementation(() => { throw new Error('blocked'); });
  vi.mocked(localStorage.setItem).mockImplementation(() => { throw new Error('blocked'); });
  const root = document.createElement('div');
  const button = document.createElement('button');
  button.className = 'wdg-transport-position';
  const nested = document.createElement('div');
  const other = button.cloneNode() as HTMLButtonElement;
  nested.append(other);
  root.append(button, nested);
  document.body.append(root);
  const onUnit = vi.fn();
  const binding = bindTransportPosition(root, { remember: 'unavailable', onUnit });
  expect(onUnit).toHaveBeenLastCalledWith('beats');
  other.click();
  expect(onUnit).toHaveBeenCalledOnce();
  button.click();
  expect(onUnit).toHaveBeenLastCalledWith('seconds');
  binding.destroy();
});
