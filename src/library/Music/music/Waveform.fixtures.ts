import { defineFixtures } from '../../fixtures';
import { packedOf, type Peak } from './levels';
import type { WaveformProps } from './Waveform.model';

/** Deterministic measured-data stand-in: attacks, quiet middle eight and genuine silence. */
function invent(columns: number, seed: number): Peak[] {
  let n = seed;
  const random = () => ((n = (n * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  return Array.from({ length: columns }, (_, i) => {
    const at = i / columns;
    const quiet = at > .42 && at < .5 ? 0 : at > .6 && at < .72 ? .18 : 1;
    const beat = (i % Math.round(columns / 96)) / Math.round(columns / 96);
    const body = (.35 + .4 * Math.sin(at * Math.PI * 2)) * quiet;
    const max = Math.min(1, (body + (1 - beat) ** 3 * .8 * quiet) * (.7 + random() * .3));
    return { min: -max * (.8 + random() * .2), max };
  });
}
export const waveformPeaks = packedOf(invent(48000, 7));
export const waveformSpectrum = Array.from({ length: 2048 }, (_, i) => {
  const cell = Math.floor(i / 2048 * (waveformPeaks.length / 2));
  const amplitude = Math.max(Math.abs(waveformPeaks[cell * 2]), waveformPeaks[cell * 2 + 1]);
  return [amplitude ** 2, (amplitude * (.2 + .8 * Math.sin(i / 31) ** 2)) ** 2, (amplitude * (.1 + .5 * Math.cos(i / 13) ** 2)) ** 2] as const;
});
export const waveformSamples = [Float32Array.from({ length: 48000 }, (_, i) => Math.sin(i * .09) * Math.exp(-((i % 3000) / 3000) * 5))];
export const waveformBase: WaveformProps = {
  peaks: waveformPeaks, ink: 'var(--stem-drums, var(--accent))', height: 78, from: 0, to: 1, label: 'Measured drum envelope',
};
export const waveformArgTypes = {
  from: { control: { type: 'range', min: 0, max: 1, step: .001 } },
  to: { control: { type: 'range', min: 0, max: 1, step: .001 } },
  height: { control: { type: 'range', min: 20, max: 200, step: 2 } },
  smooth: { control: { type: 'range', min: 0, max: 1, step: .05 } },
  headroom: { control: { type: 'range', min: .1, max: 1, step: .05 } },
  density: { control: { type: 'number', min: .05, max: 4, step: .25 } },
  visibleShare: { control: { type: 'range', min: .01, max: 1, step: .01 } },
  ink: { control: 'text' }, label: { control: 'text' },
  peaks: { control: false }, samples: { control: false }, colors: { control: false },
  spectrum: { control: false }, presentation: { control: false }, className: { control: false },
} as const;
export const waveformStories = defineFixtures<WaveformProps>()({
  Default: { args: waveformBase },
  Empty: { args: { ...waveformBase, peaks: [], label: 'No reading' } },
  Silence: { args: { ...waveformBase, from: .42, to: .5, height: 44, label: 'A silent run' } },
  Colors: { args: { ...waveformBase, colors: ['var(--stem-drums)', 'var(--stem-bass)', 'var(--stem-vocals)'], label: 'Host-provided colour gradient' } },
  Samples: { args: { ...waveformBase, samples: waveformSamples, from: .003, to: .006, density: 2, label: 'Deep zoom reads audio samples' } },
});
