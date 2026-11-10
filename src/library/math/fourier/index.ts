// Fourier series as rotating arrows: the model and the figures that show it.
// `Complex` stays internal: the lab area exports a type of that name.
export { add, sub, mul, scale, conj, abs, arg, cis, polar, turn } from './model/complex';
export * from './model/fourier';
export { useClock, type Clock } from './useClock';
export { Epicycles, type EpicyclesProps } from './components/Epicycles/Epicycles';
export { HeatModes, type HeatModesProps } from './components/HeatModes/HeatModes';
export { StepSeries, type StepSeriesProps } from './components/StepSeries/StepSeries';
export { RotatingVector, type RotatingVectorProps } from './components/RotatingVector/RotatingVector';
export { PairToSine, type PairToSineProps } from './components/PairToSine/PairToSine';
export { CoefficientFinder, type CoefficientFinderProps } from './components/CoefficientFinder/CoefficientFinder';
