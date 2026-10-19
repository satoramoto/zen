import type { HueSlot } from '../../components/core/hue';
import type { Tier } from '../model/report';

/** Each tier's colour slot: A, B, C take hues 1, 2, 3. */
export const TIER_HUE: Record<Tier, HueSlot> = { A: 1, B: 2, C: 3 };

/** The colour slot of the `index`th segment: hues 1–5, round again past five. */
export const hueAt = (index: number): HueSlot => ((index % 5) + 1) as HueSlot;
