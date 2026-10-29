import type { ReactNode } from 'react';
import { Tree } from '../../view/Tree';
import { mixerSectionView, separatorView, type SeparatorProps } from './Separator.model';

export type { SeparatorProps } from './Separator.model';

export function Separator(props: SeparatorProps) {
  return <Tree tree={separatorView(props)} />;
}

export function MixerSection({ className, children }: { className: string; children?: ReactNode }) {
  return <Tree tree={mixerSectionView({ className })} slots={{ children }} />;
}
