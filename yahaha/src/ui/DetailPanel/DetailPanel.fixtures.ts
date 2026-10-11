import type { ComponentProps } from 'svelte'
import type DetailPanel from './DetailPanel.svelte'

/** Library › Sounds: Silk Strings chosen, playing on Right 2 and Left; Audition off while the band runs. */
export const detailSound = {
  label: 'Sound details',
  title: 'Silk Strings',
  number: '049',
  badge: 'Favourite',
  badgeHue: 'a',
  subtitle: 'Strings · Built-in',
  fields: [
    { label: 'Category', values: [{ text: 'Strings' }] },
    {
      label: 'Playing on',
      values: [
        { text: 'Right 2', hue: 'r2' },
        { text: 'Left', hue: 'l' },
      ],
    },
    { label: 'Bank', values: [{ text: 'MSB 0 · LSB 0 · PC 49' }] },
  ],
  actions: [
    {
      actions: [
        { id: 'audition', label: 'Audition', disabled: true, tip: 'sound.audition' },
        { id: 'use', label: 'Use on Right 1', primary: true, tip: 'sound.use_on_part' },
      ],
      note: 'Stop the band to audition.',
    },
    { actions: [{ id: 'favourite', label: 'Remove favourite', tip: 'sound.favourite' }] },
  ],
  emptyText: 'Choose a sound to see its details.',
  width: 360,
} satisfies ComponentProps<typeof DetailPanel>

/** Library › Racks: the Sunday drive rack, loaded and stored on Quick Rack A1. */
export const detailRack = {
  label: 'Rack details',
  title: 'Sunday drive',
  badge: 'Modified',
  badgeHue: 'warn',
  subtitle: 'Saved 3 October',
  fields: [
    { label: 'Quick Rack', values: [{ text: 'A1' }] },
    {
      label: 'Parts',
      values: [
        { text: 'Right 1', hue: 'r1' },
        { text: 'Right 2', hue: 'r2' },
        { text: 'Left', hue: 'l' },
      ],
    },
    { label: 'Plugin', values: [{ text: 'Sampler Deluxe', hue: 'a' }] },
  ],
  actions: [
    {
      actions: [
        { id: 'load', label: 'Load', primary: true, tip: 'library.rack_load' },
        { id: 'save', label: 'Save', tip: 'rack.save' },
        { id: 'duplicate', label: 'Duplicate', tip: 'library.rack_duplicate' },
        { id: 'delete', label: 'Delete', hue: 'ending', tip: 'library.rack_delete' },
      ],
    },
  ],
  emptyText: 'Choose a rack to see its details.',
  width: 360,
} satisfies ComponentProps<typeof DetailPanel>
