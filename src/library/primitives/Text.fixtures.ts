// Text's stories as plain data: Text.stories.tsx (React) and Text.stories.svelte.ts (Svelte) both
// draw them, and parity.test.tsx renders every instance in `textStories` in both.
import { defineFixtures } from '../fixtures';
import { TEXT_ROLES, TEXT_TONES, type TextModelProps, type TextRole, type TextTone } from './Text.model';

export const SAMPLE: Record<TextRole, string> = {
  display: 'Stage',
  numeral: '128.0',
  heading: 'Sections',
  body: 'Intro A',
  label: 'Tempo',
  caption: 'Bar 12',
  code: 'C#m7 / 0:42',
  math: 'fₙ = n·f₁',
};

/** The Playground's controls (a story's own args: the text, the width and an `inherit` tone). */
export interface TextArgs {
  role: TextRole;
  tone: TextTone | 'inherit';
  truncate: boolean;
  tabular: boolean;
  text: string;
  width: number;
}

export const textArgs: TextArgs = { role: 'heading', tone: 'primary', truncate: false, tabular: false, text: 'Main B into Fill A, then the ending', width: 360 };

export const textArgTypes = {
  role: { control: 'select', options: TEXT_ROLES },
  tone: { control: 'select', options: ['inherit', ...TEXT_TONES] },
  truncate: { control: 'boolean' },
  tabular: { control: 'boolean' },
  text: { control: 'text' },
  width: { control: { type: 'range', min: 80, max: 900, step: 10 } },
} as const;

/** The Playground's Text props for its args. */
export const textProps = ({ role, tone, truncate, tabular }: TextArgs): TextModelProps => ({
  role,
  tone: tone === 'inherit' ? undefined : tone,
  truncate,
  tabular,
});

// MathML specimens (React's JSX types have no MathML elements, so they are markup).
export const HARMONIC = '<math><msub><mi>f</mi><mi>n</mi></msub><mo>=</mo><mi>n</mi><msub><mi>f</mi><mn>1</mn></msub></math>';
export const BASEL = '<math><mfrac><msup><mi>π</mi><mn>2</mn></msup><mn>6</mn></mfrac></math>';

type Instance = TextModelProps & { as?: string };

/** Every Text the stories draw, as props: the parity fixtures. (The MathML inside the math story is
 *  markup either renderer passes through untouched, so its Texts are compared without it.) */
export const textStories = defineFixtures<Instance>()({
  Playground: { args: { ...textProps(textArgs), as: 'p', children: textArgs.text } },
  AllRolesAndTones: {
    items: [
      ...TEXT_TONES.map((tone) => ({ role: 'caption' as const, tone: 'muted' as const, children: String(tone) })),
      ...TEXT_ROLES.flatMap((role) => [
        { role: 'caption' as const, tone: 'muted' as const, children: role },
        ...TEXT_TONES.map((tone) => ({ role, tone, children: SAMPLE[role] })),
      ]),
    ],
  },
  MathInText: {
    items: [
      { as: 'p', role: 'body', tone: 'primary', children: 'The nth harmonic of a string sounds at' },
      { tone: 'accent', children: 'n' },
      { role: 'math', size: 'inherit' },
    ],
  },
});
