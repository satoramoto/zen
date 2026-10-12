// Music components: faders, knobs, pads, keys and the readouts an instrument shows. Generic: a
// part, a style or a transport is an app's meaning, given to them as a hue or role slot.
export { Fader, type FaderProps, type FaderHue, type FaderKind } from './Fader/Fader';
export { Knob, type KnobProps } from './Knob/Knob';
export { Pad, padTone, tieLastWord, type PadProps, type PadFamily, type PadState, type PadTone, type PadOnFace } from './Pad/Pad';
export { Keys, type KeysProps } from './Keys/Keys';
export { BarBeat, beatState, type BarBeatProps, type BeatState } from './BarBeat/BarBeat';
export { BarReadout, type BarReadoutProps } from './BarReadout/BarReadout';
export { TempoReadout, type TempoReadoutProps } from './TempoReadout/TempoReadout';
export { ChordReadout, type ChordReadoutProps, type ChordNote } from './ChordReadout/ChordReadout';
export { SendReadout, type SendReadoutProps } from './SendReadout/SendReadout';
export { SectionName, type SectionNameProps, type SectionState } from './SectionName/SectionName';
export { PartMarks, type PartMarksProps } from './PartMarks/PartMarks';
export { SoundCell, type SoundCellProps } from './SoundCell/SoundCell';
export { RackCell, type RackCellProps } from './RackCell/RackCell';
export { Meter, type MeterProps, type MeterLayout, type MeterSide } from './Meter/Meter';
