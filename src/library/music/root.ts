// The token-drawn music parts, exported flat from the package root (`src/library/index.ts`):
// faders, knobs, pads, keys and the readouts an instrument shows. Generic: a part, a style or a
// transport is an app's meaning, given to them as a hue or role slot. The mix[flow] toolkit beside
// them in `components/` is the `Music` namespace (`index.ts`). Where both had a name, the part here
// has its own (`KnobReadout`, `LevelMeter`, `TransportBar`) and keeps the old one as an alias.
export { Fader, type FaderProps, type FaderHue, type FaderKind } from './components/Fader/Fader';
export { KnobReadout, KnobReadout as Knob, type KnobReadoutProps, type KnobReadoutProps as KnobProps } from './components/KnobReadout/KnobReadout';
export { Pad, padTone, tieLastWord, type PadProps, type PadFamily, type PadState, type PadTone, type PadOnFace } from './components/Pad/Pad';
export { Keys, type KeysProps } from './components/Keys/Keys';
export { BarBeat, beatState, type BarBeatProps, type BeatState } from './components/BarBeat/BarBeat';
export { BarReadout, type BarReadoutProps } from './components/BarReadout/BarReadout';
export { TempoReadout, type TempoReadoutProps } from './components/TempoReadout/TempoReadout';
export { ChordReadout, type ChordReadoutProps, type ChordNote } from './components/ChordReadout/ChordReadout';
export { SendReadout, type SendReadoutProps } from './components/SendReadout/SendReadout';
export { SectionName, type SectionNameProps, type SectionState } from './components/SectionName/SectionName';
export { PartMarks, type PartMarksProps } from './components/PartMarks/PartMarks';
export { SoundCell, type SoundCellProps } from './components/SoundCell/SoundCell';
export { RackCell, type RackCellProps } from './components/RackCell/RackCell';
export { LevelMeter, LevelMeter as Meter, type LevelMeterProps, type LevelMeterProps as MeterProps, type MeterLayout, type MeterSide } from './components/LevelMeter/LevelMeter';

// The live workspace's parts, and the plain data they share (docs/live-workspace.md).
export * from './model/live.model';
export { XYPad, XY_PAD_FORMS, XY_TRAIL_POINTS, clamp01, xyTrailPoints, type XYPadProps, type XYPadForm } from './components/XYPad/XYPad';
export { MacroPads, MACRO_PADS_FORMS, MACRO_PADS_MAX, type MacroPadsProps, type MacroPadsForm, type MacroPad } from './components/MacroPads/MacroPads';
export { StemLanes, STEM_LANES_FORMS, type StemLanesProps, type StemLanesForm } from './components/StemLanes/StemLanes';
export {
  TransitionRow,
  TRANSITION_STATES,
  TRANSITION_LABELS,
  type TransitionRowProps,
  type TransitionPad,
  type TransitionState,
} from './components/TransitionRow/TransitionRow';
export { ChordStrip, CHORD_STRIP_FORMS, type ChordStripProps, type ChordStripForm, type ChordStripState } from './components/ChordStrip/ChordStrip';
export { ArpSequencer, ARP_SEQUENCER_FORMS, type ArpSequencerProps, type ArpSequencerForm } from './components/ArpSequencer/ArpSequencer';
export { LoopPie, LOOP_PIE_FORMS, clampPhase, loopWedge, type LoopPieProps, type LoopPieForm } from './components/LoopPie/LoopPie';
export { LoopGrid, LOOP_GRID_FORMS, cellName, type LoopGridProps, type LoopGridForm } from './components/LoopGrid/LoopGrid';
export { SendBars, SEND_BARS_FORMS, SEND_UNITY, clampSend, type SendBarsProps, type SendBarsForm } from './components/SendBars/SendBars';
export {
  MixBand,
  MIX_BAND_FORMS,
  type MixBandProps,
  type MixBandForm,
} from './components/MixBand/MixBand';
export { TransportBar, TransportBar as Transport, TRANSPORT_FORMS, TRANSPORT_UNITS, clockText, positionText, readingText, type TransportBarProps, type TransportBarProps as TransportProps, type TransportForm, type TransportLoop, type TransportPosition, type TransportTempo, type TransportUnit } from './components/TransportBar/TransportBar';
export { DeviceFace, DEVICE_FACE_FORMS, type DeviceFaceProps, type DeviceFaceForm } from './components/DeviceFace/DeviceFace';
export { PianoRoll, PIANO_ROLL_FORMS, type PianoRollProps, type PianoRollForm, type PianoRollKey, type PianoRollNote } from './components/PianoRoll/PianoRoll';
