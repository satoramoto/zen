import type { DetailedHTMLProps, HTMLAttributes, ReactNode } from 'react';
import { Text, type TextTone } from '../../../primitives/Text';
import { toMathML } from '../../model/formula';
import './Formula.css';

// React's types have no MathML elements; React DOM renders them in the MathML namespace.
type MathMLProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  display?: 'block' | 'inline';
  mathvariant?: string;
  stretchy?: 'true' | 'false';
  largeop?: 'true' | 'false';
  movablelimits?: 'true' | 'false';
  form?: 'prefix' | 'infix' | 'postfix';
  lspace?: string;
  rspace?: string;
  width?: string;
};
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      math: MathMLProps;
      mrow: MathMLProps;
      mi: MathMLProps;
      mn: MathMLProps;
      mo: MathMLProps;
      mtext: MathMLProps;
      mfrac: MathMLProps;
      msub: MathMLProps;
      msup: MathMLProps;
      msubsup: MathMLProps;
      munder: MathMLProps;
      mover: MathMLProps;
      munderover: MathMLProps;
      mspace: MathMLProps;
    }
  }
}

export interface FormulaProps {
  /** The formula in TeX, typeset to MathML (`toMathML`). The usual way to write one. */
  tex?: string;
  /** Or hand-written MathML content: `mrow`, `mi`, `mn`, `mo`, `mfrac`… (the `math` element is added). */
  children?: ReactNode;
  /** A displayed formula on its own line, centred in the reading column; default inline. */
  block?: boolean;
  /** What it says, for assistive technology that doesn't read MathML. */
  label?: string;
  tone?: TextTone;
}

/**
 * **Job.** A formula in native MathML, no rendering library: TeX typeset by temml, or MathML
 * written by hand. Its size and ink come from a `Text` of the `math` role around the `math`
 * element, which sets the contract's math face (`--font-math`) on both.
 */
export function Formula({ tex, children, block = false, label, tone }: FormulaProps) {
  return (
    <Text
      as={block ? 'div' : 'span'}
      role="math"
      size={block ? undefined : 'inherit'}
      tone={tone}
      className="cmp-math"
      data-block={block ? '' : undefined}
    >
      {tex !== undefined ? (
        <span className="cmp-math__ml" dangerouslySetInnerHTML={{ __html: toMathML(tex, block, label) }} />
      ) : (
        <math display={block ? 'block' : 'inline'} aria-label={label}>
          {children}
        </math>
      )}
    </Text>
  );
}

/* Small builders for hand-written MathML, so a formula reads close to how it's written. */

export const frac = (a: ReactNode, b: ReactNode) => (
  <mfrac>
    <mrow>{a}</mrow>
    <mrow>{b}</mrow>
  </mfrac>
);
/** `1/n` with the numerator and the denominator as numbers or identifiers. */
export const recip = (d: ReactNode) => frac(<mn>1</mn>, typeof d === 'number' ? <mn>{d}</mn> : d);
