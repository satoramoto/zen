import { Tree } from '../../view/Tree';
import {
  frameMeterHandlers, frameMeterView, framePlayheadHandlers, framePlayheadView,
  frameWaveformHandlers, frameWaveformView, type FrameMeterProps, type FramePlayheadProps, type FrameWaveformProps,
} from './frames.model';
import '../base.css';
import '../music/Meter.css';
import './mixer.css';

export type { FrameMeterProps, FramePlayheadProps, FrameWaveformProps } from './frames.model';

export function FrameMeter(props: FrameMeterProps) {
  return <Tree tree={frameMeterView(props)} handlers={frameMeterHandlers(props)} />;
}
export function FramePlayhead(props: FramePlayheadProps) {
  return <Tree tree={framePlayheadView(props)} handlers={framePlayheadHandlers(props)} />;
}
export function FrameWaveform(props: FrameWaveformProps) {
  return <Tree tree={frameWaveformView(props)} handlers={frameWaveformHandlers(props)} />;
}
