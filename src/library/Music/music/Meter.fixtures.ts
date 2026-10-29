import { defineFixtures } from '../../fixtures';
import type { MeterProps } from './Meter.model';

export const meterArgTypes = {
  value: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  peak: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
  orientation: { control: 'radio', options: ['horizontal', 'vertical'] },
  layout: { control: 'radio', options: ['stacked', 'inline', 'inside'] },
  side: { control: 'radio', options: ['left', 'right'] },
  showValue: { control: 'boolean' },
  width: { control: { type: 'range', min: 2, max: 24, step: 1 } },
  length: { control: { type: 'range', min: 20, max: 210, step: 1 } },
  name: { control: 'text' }, label: { control: 'text' }, title: { control: 'text' }, hint: { control: 'text' },
  ink: { control: 'color' }, display: { control: 'text' }, className: { control: false }, driver: { control: false },
} as const;

export const meterStories = defineFixtures<MeterProps>()({
  Level: { args: { value: 0.62, name: 'Out', label: 'Output level' } },
  WithPeak: { args: { value: 0.45, peak: 0.83, name: 'Peak', label: 'Output with peak' } },
  Vertical: { args: { value: 0.7, peak: 0.9, orientation: 'vertical', length: 60, name: 'L', label: 'Left level' } },
  Readout: { args: { value: 0.62, name: 'Out', label: 'Output reading', layout: 'inline', side: 'right', showValue: true, display: '−4.2 dB' } },
  Inside: { args: { value: 0.62, name: 'Out', label: 'Inside reading', layout: 'inside', showValue: true, length: 200 } },
  Clamped: { items: [{ value: 2, peak: 2, label: 'Over range' }, { value: -1, peak: -1, label: 'Under range' }, { value: Number.NaN, label: 'Not a number' }] },
});
