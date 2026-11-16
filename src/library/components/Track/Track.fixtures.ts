// Track's stories as plain props: Track.stories.tsx draws them with any renderer, and the tree
// snapshot records every one.
import { defineFixtures } from '../../fixtures';
import type { TrackModelProps } from './Track.model';

export const trackStories = defineFixtures<TrackModelProps>()({
  /** Twice what is needed: right of the mark, filled from it, good. */
  Ahead: { args: { value: 2, label: 'Our multiplier against what KRX needs', display: '2×' } },
  /** Just short of the mark: close. */
  Close: { args: { value: 0.94, label: 'Our multiplier against what PRL needs', display: '0.94×' } },
  /** Well short: quiet, not red. */
  Short: { args: { value: 0.3, label: 'Our multiplier against what EPIC needs', display: '0.3×' } },
  /** A tone set from outside: a listing that clears its target whatever the ratio says. */
  Cleared: { args: { value: 0.97, tone: 'good', label: 'Margin against the target', display: '+12%' } },
  /** A share from nothing to all, no mark, no fill. */
  Share: { args: { value: 0.35, mode: 'share', label: 'Share of the network', display: '35%' } },
  /** Past the end of the range: held at the edge. */
  Beyond: { args: { value: 40, label: 'Headroom', display: '40×' } },
  /** A wider range and no mark. */
  NoMark: { args: { value: 3, range: 16, mark: false, fill: false, label: 'Against the median' } },
});
