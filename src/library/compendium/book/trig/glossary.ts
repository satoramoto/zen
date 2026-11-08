// The trigonometry book's glossary: the entries its chapters peek at but don't contain.
import type { EntryHead } from '../../model/document';

export const TRIG_GLOSSARY: Record<string, EntryHead> = {
  'standard-position': {
    title: 'Standard position',
    kind: 'Convention',
    standing: 'established',
    summary: 'An angle drawn from the positive x-axis, turning anticlockwise for a positive angle and clockwise for a negative one, with its corner at the origin.',
  },
  radian: {
    title: 'Radian',
    kind: 'Unit',
    standing: 'established',
    summary: 'The angle whose arc is exactly as long as the radius. A full turn is 2π radians, so one radian is 180/π degrees, a little over 57.3°.',
  },
  similar: {
    title: 'Similar triangles',
    kind: 'Concept',
    standing: 'established',
    summary: 'Triangles with the same three angles. One is a scaled copy of the other, so the ratio of any two of its sides is the same in both.',
  },
  'reference-angle': {
    title: 'Reference angle',
    kind: 'Concept',
    standing: 'established',
    summary: 'The sharp angle between an angle’s end and the x-axis, always between 0° and 90°. Sine and cosine at any angle are the values at its reference angle, with a sign set by the quadrant.',
  },
  period: {
    title: 'Period',
    kind: 'Concept',
    standing: 'established',
    summary: 'How far along you go before a repeating pattern starts again. Sine and cosine have period 2π; tangent has period π.',
  },
  'inverse-function': {
    title: 'Inverse function',
    kind: 'Concept',
    standing: 'established',
    summary: 'The function that undoes another: give it the output and it gives back the input. It only exists where every output comes from one input, which is why sine is first cut down to a piece where it does.',
  },
  identity: {
    title: 'Identity',
    kind: 'Concept',
    standing: 'established',
    summary: 'An equation that holds for every value of its variable, not just for some. Checking one value cannot prove it; it says something true about the functions themselves.',
  },
  sinusoid: {
    title: 'Sinusoid',
    kind: 'Concept',
    standing: 'established',
    summary: 'Any curve shaped like a sine wave: y = A·sin(B(x − C)) + D, stretched, squeezed, slid and lifted. Cosine is one, slid by a quarter period.',
  },
};
