// Fourier series as rotating arrows: the model and the figures that show it.
// `Complex` stays internal: the lab area exports a type of that name.
export { add, sub, mul, scale, conj, abs, arg, cis, polar, turn } from './model/complex';
export * from './model/fourier';
export { useClock, type Clock } from './useClock';
export { Epicycles, type EpicyclesProps } from './Epicycles';
export { HeatModes, type HeatModesProps } from './HeatModes';
export { StepSeries, type StepSeriesProps } from './StepSeries';
export { RotatingVector, type RotatingVectorProps } from './RotatingVector';
export { PairToSine, type PairToSineProps } from './PairToSine';
export { CoefficientFinder, type CoefficientFinderProps } from './CoefficientFinder';
