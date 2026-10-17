import type { Meta, StoryObj } from '@storybook/react-vite';
import { withLibraryTheme } from '../storybook';
import { Stack } from '../primitives/Stack';
import { Surface } from '../primitives/Surface';
import { Text } from '../primitives/Text';
import { HarmonicString } from './HarmonicString';
import { LEAN_SAMPLE, PEEKS, PROOF, TIMELINE, TIMELINE_AXIS } from './harmonic.sample';
import { Mark, MarkLegend } from './Mark';
import { Formula, frac, recip } from './Math';
import { Peek } from './Peek';
import { ProofGraph } from './ProofGraph';
import { H, P, Reading, Wide } from './Reading';
import { Sidenote } from './Sidenote';
import { Timeline } from './Timeline';
import './Entry.css';

const dots = <mo>⋯</mo>;

/** Σ from n = 1 to ∞ of 1/n. */
const sum = (
  <mrow>
    <munderover>
      <mo>∑</mo>
      <mrow>
        <mi>n</mi>
        <mo>=</mo>
        <mn>1</mn>
      </mrow>
      <mi>∞</mi>
    </munderover>
    {recip(<mi>n</mi>)}
  </mrow>
);

const sub = (base: string, i: string) => (
  <msub>
    <mi>{base}</mi>
    <mi>{i}</mi>
  </msub>
);

/** A bracketed group of reciprocals: (1/a + … + 1/b). */
const group = (a: number, b: number, ellipsis = false) => (
  <mrow>
    <mo>(</mo>
    {recip(a)}
    <mo>+</mo>
    {ellipsis && (
      <>
        {dots}
        <mo>+</mo>
      </>
    )}
    {recip(b)}
    <mo>)</mo>
  </mrow>
);

function TheHarmonicSeries() {
  return (
    <Surface layer="base" radius="none" className="cmp-entry">
      <Reading measure={66}>
        <Stack gap={3} as="header" className="cmp-entry__head">
          <Text role="label" tone="muted">
            Compendium · Mathematics · Acoustics
          </Text>
          <Text as="h1" role="display" size="heading" weight="display" tone="primary">
            The harmonic series
          </Text>
          <Text as="p" role="body" tone="secondary" className="cmp-entry__lede">
            Add the reciprocals of the counting numbers and the sum never settles. The same numbers describe how a string
            vibrates, which is how the series got its name.
          </Text>
          <MarkLegend />
        </Stack>

        <H>The series</H>
        <P>
          <Mark standing="consequence" />
          The harmonic series adds the reciprocals of the counting numbers, and its sum is infinite:
        </P>
        <Formula block label="The sum over n from 1 to infinity of 1 over n equals 1 plus a half plus a third plus a quarter and so on, which is infinite">
          {sum}
          <mo>=</mo>
          <mn>1</mn>
          <mo>+</mo>
          {recip(2)}
          <mo>+</mo>
          {recip(3)}
          <mo>+</mo>
          {recip(4)}
          <mo>+</mo>
          {dots}
          <mo>=</mo>
          <mi>∞</mi>
        </Formula>
        <P>
          <Mark standing="consequence" />
          It gets there slowly. The sum of the first <Formula><mi>n</mi></Formula> terms,{' '}
          <Formula>{sub('H', 'n')}</Formula>, grows like <Formula><mi>ln</mi><mi>n</mi><mo>+</mo><mi>γ</mi></Formula>, where{' '}
          <Formula><mi>γ</mi><mo>≈</mo><mn>0.5772</mn></Formula> is the Euler–Mascheroni constant: a million terms add up to
          only about 14.39.
          <Sidenote>Euler showed in 1734 that H(n) − ln n tends to a constant, and computed it to several places.</Sidenote>
        </P>
        <P>
          <Mark standing="conjecture" />
          The partial sums even reach the Riemann hypothesis. Lagarias showed it is equivalent to{' '}
          <Formula>
            <mi>σ</mi><mo>(</mo><mi>n</mi><mo>)</mo><mo>≤</mo>{sub('H', 'n')}<mo>+</mo>
            <msup><mi>e</mi>{sub('H', 'n')}</msup>
            <mi>ln</mi>{sub('H', 'n')}
          </Formula>{' '}
          for every <Formula><mi>n</mi><mo>≥</mo><mn>1</mn></Formula>, where σ(n) is the sum of the divisors of n. Whether
          the inequality always holds is open.
          <Sidenote cite>
            J. C. Lagarias, “An elementary problem equivalent to the Riemann hypothesis”, American Mathematical Monthly 109
            (2002).
          </Sidenote>
        </P>

        <H>Why “harmonic”</H>
        <P>
          <Mark standing="established" />A string fixed at both ends can vibrate only in modes that fit a whole number of
          half-waves along it. Mode <Formula><mi>n</mi></Formula> has wavelength{' '}
          <Formula><msub><mi>λ</mi><mi>n</mi></msub><mo>=</mo>{frac(<mrow><mn>2</mn><mi>L</mi></mrow>, <mi>n</mi>)}</Formula> and
          frequency <Formula><msub><mi>f</mi><mi>n</mi></msub><mo>=</mo><mi>n</mi><msub><mi>f</mi><mn>1</mn></msub></Formula>:
          the <Peek entry={PEEKS.overtone}>overtones</Peek> of an ideal string are whole multiples of its fundamental.{' '}
          <Mark standing="interpretation" />
          Its wavelengths, 1, 1/2, 1/3, … of the fundamental’s, are the terms of the series, and that is where the name is
          usually traced.
          <Sidenote cite>
            J. Sauveur, “Système général des intervalles des sons”, Mémoires de l’Académie royale des sciences (1701),
            where the overtones are first called harmoniques.
          </Sidenote>
        </P>
        <Wide>
          <HarmonicString />
        </Wide>

        <H>Intervals from ratios</H>
        <P>
          <Mark standing="established" />
          Neighbouring harmonics make the consonances: 2:1 is the octave, 3:2 the fifth, 4:3 the fourth, 5:4 the major
          third. <Peek entry={PEEKS.pythagorean} /> builds a whole scale from the first two. The story that Pythagoras found
          the ratios in a smithy’s hammers is a legend.
          <Sidenote cite>
            Nicomachus of Gerasa, Manual of Harmonics (2nd century CE); Boethius retells it in De institutione musica.
          </Sidenote>
        </P>
        <P>
          <Mark standing="interpretation" />
          Rameau made the sounding body and its harmonics the ground of harmony itself, reading the major triad off
          harmonics 4, 5 and 6.
          <Sidenote cite>
            J.-P. Rameau, Traité de l’harmonie (1722); the argument from the corps sonore is worked out in Génération
            harmonique (1737).
          </Sidenote>{' '}
          <Mark standing="speculation" />
          One suggestion for why small ratios sound consonant at all is that the ear learns harmonic templates from voices,
          whose spectra are harmonic.
        </P>

        <H>Oresme’s proof</H>
        <P>
          <Mark standing="consequence" />
          Around 1350 Nicole Oresme showed the sum is infinite by grouping its terms: after the first two, take the next
          two, then the next four, then the next eight. Each group comes to at least a half, and there are infinitely many
          groups, so the partial sums pass every bound: the series <Peek entry={PEEKS.divergence}>diverges</Peek>.
          <Sidenote cite>
            N. Oresme, Quaestiones super geometriam Euclidis (c. 1350). Mengoli (1647) and the Bernoullis (1689) later gave
            other proofs.
          </Sidenote>
        </P>
        <Formula block label="1 plus a half plus a third plus a quarter, plus a fifth through an eighth, and so on, is at least 1 plus a half plus a half plus a half and so on">
          <mn>1</mn>
          <mo>+</mo>
          {recip(2)}
          <mo>+</mo>
          {group(3, 4)}
          <mo>+</mo>
          {group(5, 8, true)}
          <mo>+</mo>
          {dots}
          <mo>≥</mo>
          <mn>1</mn>
          <mo>+</mo>
          {recip(2)}
          <mo>+</mo>
          {recip(2)}
          <mo>+</mo>
          {recip(2)}
          <mo>+</mo>
          {dots}
        </Formula>

        <H>In Lean</H>
        <P>
          The same fact as a formal statement. The graph shows what its proof rests on.{' '}
          <Mark standing="interpretation" />
          Cauchy condensation, at the bottom, is Oresme’s grouping made general.
        </P>
        <Wide>
          <Stack gap={4}>
            <Surface material="well" radius="input" className="cmp-entry__code">
              <Stack gap={2}>
                <Text role="label" size="caption" tone="warning">
                  Sample
                </Text>
                <Text as="pre" role="code" size="caption" tone="primary" className="cmp-entry__pre">
                  {LEAN_SAMPLE}
                </Text>
              </Stack>
            </Surface>
            <ProofGraph data={PROOF} label="What the Lean proof of divergence depends on" />
          </Stack>
        </Wide>

        <H>History</H>
        <Wide>
          <Stack gap={3}>
            <Timeline rows={TIMELINE} axis={TIMELINE_AXIS} label="People and works in the history of the harmonic series" />
            <Text role="caption" tone="muted">
              Lives as bars (lighter where the dates are approximate), works as dots. The axis breaks between antiquity and
              1300.
            </Text>
          </Stack>
        </Wide>
      </Reading>
    </Surface>
  );
}

/**
 * A Compendium entry, "The harmonic series": a mockup of an encyclopedia app on zen, to judge
 * which proposed primitives hold up (Reading, Sidenote, Peek, Formula, Figure, Mark, a layered
 * proof graph, Timeline). Stubs, in `src/library/compendium/`, not exported from the package.
 */
const meta = {
  title: 'Design OS/Compendium/Entry',
  component: TheHarmonicSeries,
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TheHarmonicSeries>;
export default meta;

export const Entry: StoryObj<typeof meta> = {};
