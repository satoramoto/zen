// Text's stories as plain data: Text.stories.tsx draws them as view trees (`textPlayground`,
// `textGrid`) in either renderer, parity.test.tsx renders every instance in `textStories` with both
// Text components, and the tree snapshot draws each with `textNode`.
import { defineFixtures } from '../fixtures';
import { h, styleText, type Node } from '../view/Tree.model';
import { TEXT_ROLES, TEXT_TONES, textNode, type TextModelProps, type TextRole, type TextTone } from './Text.model';

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

/** `on-solid` is ink for a solid action fill, so it is shown on `--action`; every other tone on the page. */
export const ground = (tone: TextTone | 'inherit'): string | undefined =>
  tone === 'on-solid' ? 'background: var(--action); border-radius: var(--radius-control); padding: var(--space-1) var(--space-2)' : undefined;

/** The Playground's tree: one paragraph Text in a box of the args' width. */
export const textPlayground = (args: TextArgs): Node =>
  h(
    'div',
    { style: styleText({ width: `${args.width}px`, padding: 'var(--space-4)' }) },
    textNode({ ...textProps(args), as: 'p' }, { style: ground(args.tone) }, args.text),
  );

/** Every role (rows) in every tone (columns), as one tree. */
export const textGrid = (): Node =>
  h(
    'div',
    { style: 'padding: var(--space-4); overflow-x: auto' },
    h(
      'div',
      {
        style: styleText({
          display: 'grid',
          'grid-template-columns': `auto repeat(${TEXT_TONES.length}, auto)`,
          gap: 'var(--space-2) var(--space-3)',
          'align-items': 'baseline',
        }),
      },
      h('span'),
      ...TEXT_TONES.map((tone) => textNode({ role: 'caption', tone: 'muted' }, {}, String(tone))),
      ...TEXT_ROLES.map((role) =>
        h(
          'div',
          { style: 'display: contents' },
          textNode({ role: 'caption', tone: 'muted' }, {}, role),
          ...TEXT_TONES.map((tone) => textNode({ role, tone }, { style: ground(tone) }, SAMPLE[role])),
        ),
      ),
    ),
  );

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
