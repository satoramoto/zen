/** Framework-bound mathematical presentation; evaluation remains the caller's responsibility. */
export * from './components/ExactValue';
export * from './components/ExpressionField';
export * from './components/PlotViewport/PlotViewport';
export { projectPoints } from './components/PlotViewport/PlotViewport.model';
export * from './components/MathInspector';
export * from './components/DistributionPlot';
// Linked exploration scenes are React-only; existing Svelte math primitives remain intact.
export * from './explore';
export * from './signals';
export * from './lab';
export * from './cymatics';
export * from './calculator';
export * from './perspective';
export * from './stereo';
export * from './fourier';
// The physics module and Apollo simulators
export * as Physics from './physics';
export { ApolloDescentSimulator, OrbitSimulator, Dsky, DescentSources } from './physics';
export type { ApolloDescentSimulatorProps, OrbitSimulatorProps, DskyProps, DescentLoadName, TranslunarPreset } from './physics';
// The trigonometry figures (the trig models stay under math/trig: their names, such as TAU, would clash here).
export { ArcWrap, RightTriangle, UnitCircle, WaveGraph, IdentitySquares, AngleSum, GeneralTriangle } from './trig';
export type { ArcWrapProps, RightTriangleProps, UnitCircleProps, WaveGraphProps, WaveData, IdentitySquaresProps, AngleSumProps, GeneralTriangleProps } from './trig';
// The prime-wave figures (the prime models stay under math/primes: names such as `fft` and `gaps` are too general for here).
export { BoundaryWaves, WrappedWaves, RingField, GapSpectrum, BoxField, FieldShape } from './primes';
export type { BoundaryWavesProps, WrappedWavesProps, RingFieldProps, GapSpectrumProps, GapSignal, BoxFieldProps, FieldShapeProps, FieldShapeKind } from './primes';
