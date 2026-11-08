// The trigonometry book's figures: the math area's trig components, each in the compendium's
// Figure frame. Content: the compendium's primitives never import math; the book does.
import { AngleSum, type AngleSumProps } from '../../../math/trig/AngleSum';
import { ArcWrap, type ArcWrapProps } from '../../../math/trig/ArcWrap';
import { GeneralTriangle, type GeneralTriangleProps } from '../../../math/trig/GeneralTriangle';
import { IdentitySquares, type IdentitySquaresProps } from '../../../math/trig/IdentitySquares';
import { RightTriangle, type RightTriangleProps } from '../../../math/trig/RightTriangle';
import { UnitCircle, type UnitCircleProps } from '../../../math/trig/UnitCircle';
import { WaveGraph, type WaveGraphProps } from '../../../math/trig/WaveGraph';
import { Figure } from '../../components/Figure/Figure';
import type { FigureRegistry } from '../../layout/Document/Document';

type Framed<P> = P & { number?: string };

const waveTitle = (p: WaveGraphProps) =>
  p.data ? 'Fitting a wave to readings' : p.inverse ? 'Undoing a function' : p.circle ? 'A point going round, drawn as a wave' : p.kind === 'tan' ? 'The tangent graph' : 'Four numbers shape a wave';

export const TRIG_FIGURES: FigureRegistry = {
  'arc-wrap': ({ number, ...props }: Framed<ArcWrapProps>) => (
    <Figure number={number} title="An angle as a length along the circle" source="Radius 1: the arc is as many radii long as the angle is in radians.">
      <ArcWrap {...props} />
    </Figure>
  ),
  'right-triangle': ({ number, ...props }: Framed<RightTriangleProps>) => (
    <Figure number={number} title="One angle, three ratios" source="The right angle under the free corner; θ at the origin.">
      <RightTriangle {...props} />
    </Figure>
  ),
  'unit-circle': ({ number, ...props }: Framed<UnitCircleProps>) => (
    <Figure number={number} title="The unit circle" source="Radius 1, centre at the origin; the point is (cos θ, sin θ).">
      <UnitCircle {...props} />
    </Figure>
  ),
  'wave-graph': ({ number, ...props }: Framed<WaveGraphProps>) => (
    <Figure number={number} title={waveTitle(props)} source={props.data ? 'Six readings; the band is ±0.25 m about the curve.' : 'y = A·sin(B(x − C)) + D, x in radians.'}>
      <WaveGraph {...props} />
    </Figure>
  ),
  'identity-squares': ({ number, ...props }: Framed<IdentitySquaresProps>) => (
    <Figure number={number} title="Two squares that always make one" source="The triangle in the unit circle, with squares on its sides.">
      <IdentitySquares {...props} />
    </Figure>
  ),
  'angle-sum': ({ number, ...props }: Framed<AngleSumProps>) => (
    <Figure number={number} title="The sine of a sum, as two heights" source="A unit side at α + β; its height split at the corner between the two triangles.">
      <AngleSum {...props} />
    </Figure>
  ),
  'general-triangle': ({ number, ...props }: Framed<GeneralTriangleProps>) => (
    <Figure number={number} title={props.ambiguous ? 'Side, side, angle: none, one or two' : 'Any triangle'} source={props.ambiguous ? 'Angle A and side b fixed; side a swings from C.' : 'Drag the corners; angles in degrees.'}>
      <GeneralTriangle {...props} />
    </Figure>
  ),
};
