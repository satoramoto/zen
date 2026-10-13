import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Select } from '../components/core/Select/Select';
import { CONTROL_FIELD, ControlContext } from '../primitives/Stack';
import { Group } from './Group';

const root = (name: string) => screen.getByRole('combobox', { name }).closest('[data-part="root"]');

describe('Group toolbar', () => {
  it('is a toolbar, and the controls in it take their quiet look', () => {
    render(
      <>
        <Select items={['a', 'b']} index={0} onChange={() => {}} label="field" />
        <Group name="bar" label={false} toolbar>
          <Select items={['a', 'b']} index={0} onChange={() => {}} label="quiet" />
          <ControlContext.Provider value={CONTROL_FIELD}>
            <Select items={['a', 'b']} index={0} onChange={() => {}} label="floated" />
          </ControlContext.Provider>
        </Group>
      </>,
    );
    expect(screen.getByRole('toolbar', { name: 'bar' })).toContainElement(screen.getByRole('combobox', { name: 'quiet' }));
    expect(root('quiet')).toHaveAttribute('data-quiet');
    expect(root('field')).not.toHaveAttribute('data-quiet');
    expect(root('floated')).not.toHaveAttribute('data-quiet');
  });

  it('a plain group stays a group and provides nothing', () => {
    render(
      <Group name="keys">
        <Select items={['a']} index={0} onChange={() => {}} label="in group" />
      </Group>,
    );
    expect(screen.getByRole('group', { name: 'keys' })).toBeInTheDocument();
    expect(root('in group')).not.toHaveAttribute('data-quiet');
  });
});
