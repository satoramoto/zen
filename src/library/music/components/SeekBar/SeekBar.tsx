import { Tree } from '../../../foundation/view/Tree';
import { seekBarHandlers, seekBarView, type SeekBarProps } from './SeekBar.model';
import './SeekBar.css';
export type { SeekBarProps } from './SeekBar.model';
/** Controlled seconds-based seek requests, with host-authoritative readback. */
export function SeekBar(props: SeekBarProps) { return <Tree tree={seekBarView(props)} handlers={seekBarHandlers(props)} />; }
