import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../../../../storybook';
import { EquationInput, type EquationInputProps } from './EquationInput';
function Specimen(props: EquationInputProps) {
  const [value, setValue] = useState(props.value);
  useEffect(() => setValue(props.value), [props.value]);
  return <div style={{ maxWidth: 640, padding: 32, color: 'var(--text-1)', background: 'var(--surface-0)' }}><EquationInput {...props} value={value} onChange={setValue} /><p style={{ color: 'var(--text-3)', fontSize: 12 }}>Type normally, or open the math keyboard. / makes a fraction; ^ makes a power.</p><output aria-label="Expression source" style={{ overflowWrap: 'anywhere', fontFamily: 'var(--font-mono)' }}>{value || 'Finish the expression to update its source.'}</output></div>;
}
const meta = { title: 'Math/Calculator/Components/Equation Input', component: EquationInput, decorators: [withLibraryTheme], render: args => <Specimen {...args} />, args: { id: 'equation-specimen', label: 'Equation', value: 'a*sin(b*x-t)', highlighting: true, onChange: () => {} }, argTypes: { onChange: { control: false }, onFocus: { control: false }, onParameter: { control: false } } } satisfies Meta<typeof EquationInput>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Wave: Story = {};
export const Fraction: Story = { args: { value: '(x+1)/(x^2+1)' } };
export const Envelope: Story = { args: { value: 'a*exp(-k*abs(x))*sin(b*x)' } };
export const Composition: Story = { args: { value: 'f(2*x)/2' } };

export const SyntaxColors: Story = { args: { value: 'a*sin(b*x-t)+f(x)/2+pi', activeParameter: 'a' } };
export const WithoutColors: Story = { args: { highlighting: false } };
