// Primes as waves: the model (sieve, waves in a boundary, fields, spectra) and the figures the
// Prime waves chapter draws.
export * from './model/primes';
export * from './model/waves';
export * from './model/fields';
export * from './model/spectrum';
export { BoundaryWaves, type BoundaryWavesProps } from './components/BoundaryWaves/BoundaryWaves';
export { WrappedWaves, type WrappedWavesProps } from './components/WrappedWaves/WrappedWaves';
export { RingField, type RingFieldProps } from './components/RingField/RingField';
export { GapSpectrum, type GapSpectrumProps, type GapSignal } from './components/GapSpectrum/GapSpectrum';
export { BoxField, type BoxFieldProps } from './components/BoxField/BoxField';
export { FieldShape, type FieldShapeProps, type FieldShapeKind } from './components/FieldShape/FieldShape';
