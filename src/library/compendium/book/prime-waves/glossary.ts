// The Prime waves book's glossary: the entries its chapter peeks at.
import type { EntryHead } from '../../model/document';

export const PRIME_WAVES_GLOSSARY: Record<string, EntryHead> = {
  'standing-wave': {
    title: 'Standing wave',
    kind: 'Concept',
    standing: 'established',
    summary: 'A wave held between two fixed ends, like a plucked string: it fits a whole number of half-waves, with still points (nodes) between them.',
  },
  interference: {
    title: 'Interference',
    kind: 'Concept',
    standing: 'established',
    summary: 'What waves do when they are added: where they agree they build up, where they disagree they cancel. The pattern of build-up and cancellation is the interference pattern.',
  },
  'fourier-transform': {
    title: 'Fourier transform',
    kind: 'Concept',
    standing: 'established',
    summary: 'A way of asking a signal which steady frequencies it contains, and how much of each. A spike in its spectrum is a frequency the signal keeps returning to.',
  },
  aliasing: {
    title: 'Aliasing',
    kind: 'Concept',
    standing: 'established',
    summary: 'A false pattern made by sampling something finer than the samples: the pixels catch the fine detail at uneven points, and a coarse pattern appears that is not in the thing itself.',
  },
  'prime-gap': {
    title: 'Prime gap',
    kind: 'Concept',
    standing: 'established',
    summary: 'The distance from one prime to the next. After 2 and 3, every gap is even, and gaps of 6 are the commonest for a very long way.',
  },
};
