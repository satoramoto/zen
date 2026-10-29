import {useState} from 'react';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {expect, userEvent, within} from 'storybook/test';
import {Preview} from '../bench/Preview';
import {initial, reduce, view} from '../kit/lab.mjs';

function Lab({theme, width}: {theme: string; width: number}) {
  const [state, setState] = useState(initial);
  return <Preview tree={view(state)} dispatch={(a, p, v) => setState(s => reduce(s, a, p, v))} theme={theme} width={width} />;
}
const meta = {title: 'Omarchy/Lab', component: Lab, parameters: {layout: 'fullscreen'}, args: {theme: 'tokyo', width: 850}, argTypes: {theme: {control: 'inline-radio', options: ['tokyo', 'light']}, width: {control: {type: 'range', min: 360, max: 1200, step: 10}}}} satisfies Meta<typeof Lab>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Controls: Story = {
  play: async ({canvasElement}) => {
    const c = within(canvasElement);
    await userEvent.click(c.getByRole('button', {name: 'Increment · 0'}));
    await expect(c.getByRole('button', {name: 'Increment · 1'})).toBeVisible();
    await userEvent.click(c.getByRole('checkbox', {name: 'Enabled'}));
    await expect(c.getByRole('checkbox')).toBeChecked();
    await userEvent.click(c.getByRole('combobox'));
    await userEvent.click(c.getByRole('option',{name:'Headphones'}));
    await expect(c.getByRole('combobox')).toHaveTextContent('Headphones');
    await userEvent.type(c.getByRole('textbox'), 'Works in the lab');
    await expect(c.getByRole('textbox')).toHaveValue('Works in the lab');
    await expect(c.getByRole('button', {name: 'Disabled action'})).toBeDisabled();
  },
};
export const Narrow: Story = {args: {width: 380}};
export const Light: Story = {args: {theme: 'light'}};
/** Untouched fixture for native/browser capture; Controls has an interaction play. */
export const Baseline: Story = {};
