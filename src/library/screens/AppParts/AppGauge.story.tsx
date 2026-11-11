// The app's gauge in React: a binding, one Tree.
import { Tree } from '../../view-react';
import { appGaugeView } from './appGauge';

export function AppGauge({ level }: { level: number }) {
  return <Tree tree={appGaugeView(level)} />;
}
