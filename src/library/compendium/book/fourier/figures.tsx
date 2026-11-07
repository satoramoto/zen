// The Fourier book's figures: the math area's components, each in the compendium's Figure frame.
// This is content: the compendium's primitives never import math; the book does.
import { CoefficientFinder, type CoefficientFinderProps } from '../../../math/fourier/CoefficientFinder';
import { Epicycles, type EpicyclesProps } from '../../../math/fourier/Epicycles';
import { HeatModes, type HeatModesProps } from '../../../math/fourier/HeatModes';
import { PairToSine, type PairToSineProps } from '../../../math/fourier/PairToSine';
import { RotatingVector, type RotatingVectorProps } from '../../../math/fourier/RotatingVector';
import { StepSeries, type StepSeriesProps } from '../../../math/fourier/StepSeries';
import { Figure } from '../../components/Figure/Figure';
import type { FigureRegistry } from '../../layout/Document/Document';

type Framed<P> = P & { number?: string };

export const FOURIER_FIGURES: FigureRegistry = {
  epicycles: ({ number, ...props }: Framed<EpicyclesProps>) => (
    <Figure number={number} title="Arrows tip to tail" source="Coefficients from the drawing by numerical integration, 1024 samples; arrows drawn largest first.">
      <Epicycles {...props} />
    </Figure>
  ),
  'heat-modes': ({ number, ...props }: Framed<HeatModesProps>) => (
    <Figure number={number} title="Heat on a rod, mode by mode" source="Rod of length 1, insulated ends, diffusivity 1: mode n is cos(nπx)·e^(−(nπ)²t).">
      <HeatModes {...props} />
    </Figure>
  ),
  'step-series': ({ number, ...props }: Framed<StepSeriesProps>) => (
    <Figure number={number} title="A step made of cosines" source="Coefficients 4/π · (1, −⅓, ⅕, −⅐, …) on cos(πx), cos(3πx), cos(5πx), …">
      <StepSeries {...props} />
    </Figure>
  ),
  'rotating-vector': ({ number, ...props }: Framed<RotatingVectorProps>) => (
    <Figure number={number} title="One arrow of the series" source="c · e^(n·2πi·t) for t from 0 to 1; the dots are where the tip has been this cycle.">
      <RotatingVector {...props} />
    </Figure>
  ),
  'pair-to-sine': ({ number, ...props }: Framed<PairToSineProps>) => (
    <Figure number={number} title="A pair of arrows is a cosine" source="c · e^(n·2πi·t) + c̄ · e^(−n·2πi·t) with |c| = ½: the sum is cos(n·2πt + ∠c).">
      <PairToSine {...props} />
    </Figure>
  ),
  'coefficient-finder': ({ number, ...props }: Framed<CoefficientFinderProps>) => (
    <Figure number={number} title="Spin it back, then take the average" source="cₙ = ∫₀¹ f(t) · e^(−n·2πi·t) dt, as the mean of 400 samples.">
      <CoefficientFinder {...props} />
    </Figure>
  ),
};
