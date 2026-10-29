// Story-only bridge: use the active Zen scope's resolved aliases, not widgets' ThemeRoot.
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { Decorator } from '@storybook/react-vite';
import type { MixerTheme, MixerViewProps } from '../mixer/model';
import { previewDeckIds, previewStemIds } from './previewMixer';

const themeFor = (ids: readonly string[], read: (token: string) => string): MixerTheme => ({
  primary: read('--primary'), signal: read('--signal'),
  stems: Object.fromEntries(previewStemIds.map(id => [id, read(`--stem-${id}`)])),
  decks: Object.fromEntries(ids.map((id, i) => [id, {
    ink: read(`--deck-${'abcd'[i]}`), waveform: read(`--deck-${'abcd'[i]}-waveform`),
  }])),
});

function ResolvedMixerTheme({ ids, children }: { ids: readonly string[]; children(theme: MixerTheme): ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState(() => themeFor(ids, token => `var(${token})`));
  const key = ids.join('|');
  useLayoutEffect(() => {
    const node = host.current;
    if (!node) return;
    const read = () => {
      const css = getComputedStyle(node);
      const next = themeFor(ids, token => css.getPropertyValue(token).trim() || `var(${token})`);
      setTheme(was => JSON.stringify(was) === JSON.stringify(next) ? was : next);
    };
    read();
    // Pack, facets, mode and live skin edits all change ancestor attributes. Observe those,
    // not the mixer's own frame-by-frame style writes.
    const observer = new MutationObserver(read);
    for (let ancestor: HTMLElement | null = node; ancestor; ancestor = ancestor.parentElement) {
      observer.observe(ancestor, { attributes: true, attributeFilter: ['style', 'class', 'data-mode'] });
    }
    return () => observer.disconnect();
  }, [key]);
  return <div ref={host} style={{ display: 'contents' }}>{children(theme)}</div>;
}

/** Inside withMusicScope, outside withRenderer: both renderers receive the same resolved colours. */
export const withMixerTheme: Decorator = (Story, { args }) => {
  const state = args.state as MixerViewProps['state'] | undefined;
  return <ResolvedMixerTheme ids={state?.decks.map(deck => deck.id) ?? previewDeckIds}>
    {theme => <Story args={{ ...args, theme }} />}
  </ResolvedMixerTheme>;
};
