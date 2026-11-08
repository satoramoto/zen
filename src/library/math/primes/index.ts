// Primes as waves: the model (sieve, waves in a boundary, fields, spectra) and the figures the
// Prime waves chapter draws.
export * from './model/primes';
export * from './model/waves';
export * from './model/fields';
export * from './model/spectrum';
export { BoundaryWaves, type BoundaryWavesProps } from './BoundaryWaves';
export { WrappedWaves, type WrappedWavesProps } from './WrappedWaves';
export { RingField, type RingFieldProps } from './RingField';
export { GapSpectrum, type GapSpectrumProps, type GapSignal } from './GapSpectrum';
export { BoxField, type BoxFieldProps } from './BoxField';
export { FieldShape, type FieldShapeProps, type FieldShapeKind } from './FieldShape';
