// The Prime waves book's figures: the math area's prime-wave components, each in the compendium's
// Figure frame. Content: the compendium's primitives never import math; the book does.
import { BoundaryWaves, type BoundaryWavesProps } from '../../../math/primes/components/BoundaryWaves/BoundaryWaves';
import { BoxField, type BoxFieldProps } from '../../../math/primes/components/BoxField/BoxField';
import { FieldShape, type FieldShapeProps } from '../../../math/primes/components/FieldShape/FieldShape';
import { GapSpectrum, type GapSpectrumProps } from '../../../math/primes/components/GapSpectrum/GapSpectrum';
import { RingField, type RingFieldProps } from '../../../math/primes/components/RingField/RingField';
import { WrappedWaves, type WrappedWavesProps } from '../../../math/primes/components/WrappedWaves/WrappedWaves';
import { Figure } from '../../components/Figure/Figure';
import type { FigureRegistry } from '../../layouts/Document/Document';

type Framed<P> = P & { number?: string };

export const PRIME_WAVES_FIGURES: FigureRegistry = {
  'boundary-waves': ({ number, ...props }: Framed<BoundaryWavesProps>) => (
    <Figure number={number} title={props.marks ? 'Marks that never meet' : 'A prime as a wave between two walls'} source="Prime p: sin(p·π·x) for x from 0 to 1, so p half-waves; its nodes at k/p.">
      <BoundaryWaves {...props} />
    </Figure>
  ),
  'wrapped-waves': ({ number, ...props }: Framed<WrappedWavesProps>) => (
    <Figure number={number} title="The boundary wrapped into a circle" source="Prime p: radius 1 + a·sin(p·θ) once round; past 60 primes, how many curves cross each spot.">
      <WrappedWaves {...props} />
    </Figure>
  ),
  'ring-field': ({ number, ...props }: Framed<RingFieldProps>) => (
    <Figure number={number} title="Thousands of waves, summed by radius" source="F(r) = (1/N)·Σ cos(2π·p·r) over the first N primes, our reconstruction; each pixel at its own radius, or averaged over its width.">
      <RingField {...props} />
    </Figure>
  ),
  'gap-spectrum': ({ number, ...props }: Framed<GapSpectrumProps>) => (
    <Figure number={number} title="The gaps, played as tones and transformed" source="Gap g as a tone at g times a base frequency; the magnitude of its Fourier transform beside the histogram of gaps.">
      <GapSpectrum {...props} />
    </Figure>
  ),
  'box-field': ({ number, ...props }: Framed<BoxFieldProps>) => (
    <Figure number={number} title="The waves in a square" source="G(x, y) = (1/N)·Σ cos(2π·p·x)·cos(2π·p·y), our reconstruction.">
      <BoxField {...props} />
    </Figure>
  ),
  'field-shape': ({ number, ...props }: Framed<FieldShapeProps>) => (
    <Figure number={number} title="The same field as a surface, and on a sphere" source="The square's values as heights, or wrapped round a sphere: across to longitude, up to latitude.">
      <FieldShape {...props} />
    </Figure>
  ),
};
