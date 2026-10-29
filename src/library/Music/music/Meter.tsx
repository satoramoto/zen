import { Tree } from '../../view/Tree';
import { meterView, type MeterProps } from './Meter.model';
import '../base.css';
import './Meter.css';

export type { MeterProps } from './Meter.model';

export function Meter(props: MeterProps) {
  return <Tree tree={meterView(props)} />;
}
