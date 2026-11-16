// The static form's goldens: every fixture of the parts a server may write as HTML (Track,
// Sparkline, BarList, FigureStrip, Panel), drawn by the DOM renderer and written as canonical text
// (`serialize`) to `src/rails/goldens.json`. `src/rails/static_test.rb` holds the Ruby helpers in
// `src/rails/zen_static.rb` to them, so a server's markup and the drawn part never drift apart.
// `npx vitest run src/library/foundation/view/static.goldens.test.ts -u` rewrites them.
import { expect, it } from 'vitest';
import { instances } from '../../fixtures';
import { serialize } from './domText';
import { mountPart } from './domComponents';
import { textFill } from './dom';
import { DOM_FIXTURES } from './domFixtures';

/** The parts with a static form. */
export const STATIC_PARTS = ['Track', 'Sparkline', 'BarList', 'FigureStrip', 'Panel'] as const;

it('the static goldens are what the parts draw', async () => {
  const goldens: { part: string; story: string; props: Record<string, unknown>; dom: string }[] = [];
  for (const part of STATIC_PARTS) {
    for (const [story, fixture] of Object.entries(DOM_FIXTURES[part] ?? {})) {
      instances(fixture).forEach((raw, i) => {
        const props = raw as Record<string, unknown>;
        const box = document.createElement('div');
        const { children, ...rest } = props;
        const drawn = mountPart(box, part, typeof children === 'string' ? { ...rest, children: textFill(children) } : props);
        goldens.push({ part, story: instances(fixture).length > 1 ? `${story} #${i + 1}` : story, props, dom: serialize(box) });
        drawn.destroy();
      });
    }
  }
  await expect(`${JSON.stringify(goldens, null, 2)}\n`).toMatchFileSnapshot('../../../rails/goldens.json');
});
