import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { createRawSnippet, mount, unmount } from 'svelte'
import { expect, fn, userEvent, within } from 'storybook/test'
import ChosenTabs from '../ChosenTabs/ChosenTabs.svelte'
import { faderPageTabs, layerTabs } from '../ChosenTabs/ChosenTabs.fixtures'
import HueLegend from '../HueLegend/HueLegend.svelte'
import GroupHeader from './GroupHeader.svelte'

type Content = 'faders' | 'knobs' | 'pads' | 'none'
type End = 'legend' | 'none'
type LegendItem = { label: string; hue: string }

/** The story's args: GroupHeader's own props plus the child args mapped into `children` and `end`. */
type Args = {
  title: string
  detail?: string
  count?: { label: string; value: string }
  level?: 2 | 3 | 4
  id?: string
  width?: number
  content: Content
  pageChosen: string
  onchoosePage: (id: string) => void
  layerChosen: string
  onchooseLayer: (id: string) => void
  tipAction: (node: HTMLElement, key: string) => void
  bankChosen: string
  onchooseBank: (id: string) => void
  endContent: End
  legendItems: LegendItem[]
}

const SECTION_LEGEND: LegendItem[] = [
  { label: 'Intro', hue: 'intro' },
  { label: 'Main', hue: 'main' },
  { label: 'Ending', hue: 'ending' },
  { label: 'Break', hue: 'brk' },
  { label: 'Fill', hue: 'fill' },
]

const FADERS =
  '<span style="display: contents">' +
  '<span data-mount="page" style="display: contents"></span>' +
  '<span aria-hidden="true" style="flex: none; align-self: flex-end; margin-bottom: var(--separator-lift); width: var(--line-width); height: var(--separator-length); background: var(--line)"></span>' +
  '<span style="display: flex; align-items: baseline">' +
  '<span style="margin-right: var(--space-4); font: var(--type-text); letter-spacing: var(--tracking-text); color: var(--caption-ink)">Layer</span>' +
  '<span data-mount="layer" style="display: contents"></span>' +
  '</span></span>'

const BANK = '<span data-mount="bank" style="display: contents"></span>'

const KNOB_PAGES = ['Style', 'Rack', 'Pan', 'Reverb', 'Chorus', 'Delay']
const PAD_BANKS = ['Sections', 'Quick Racks', 'Chord', 'Multi Pads', 'Setup']
const PAD_TIPS = ['padpage.sections', 'padpage.racks', 'padpage.chord', 'padpage.multi_pads', 'padpage.setup']

/** The `children` snippet for a story's `content`, mounting the real ChosenTabs. */
function children(args: Args) {
  if (args.content === 'none') return undefined
  const html = { faders: FADERS, knobs: BANK, pads: BANK }[args.content]
  return createRawSnippet(() => ({
    render: () => html,
    setup: (root: Element) => {
      const host = (name: string) => root.querySelector(`[data-mount="${name}"]`) ?? root
      const mounted: Record<string, unknown>[] = []
      if (args.content === 'faders') {
        mounted.push(
          mount(ChosenTabs, {
            target: host('page'),
            props: {
              size: 'header',
              label: 'Fader page (master button)',
              tabs: faderPageTabs,
              chosen: args.pageChosen,
              onchoose: args.onchoosePage,
              tipAction: args.tipAction,
            },
          }),
          mount(ChosenTabs, {
            target: host('layer'),
            props: {
              size: 'header',
              label: 'Fader layer',
              tabs: layerTabs,
              chosen: args.layerChosen,
              onchoose: args.onchooseLayer,
              tipAction: args.tipAction,
            },
          }),
        )
      } else {
        const knobs = args.content === 'knobs'
        const names = knobs ? KNOB_PAGES : PAD_BANKS
        mounted.push(
          mount(ChosenTabs, {
            target: host('bank'),
            props: {
              size: 'header',
              label: knobs ? 'Knob page' : 'Pad bank',
              tabs: names.map((name, i) => ({ id: String(i), label: name, tip: knobs ? 'knobs.page' : PAD_TIPS[i] })),
              chosen: args.bankChosen,
              onchoose: args.onchooseBank,
              tipAction: args.tipAction,
            },
          }),
        )
      }
      return () => {
        for (const instance of mounted) void unmount(instance)
      }
    },
  }))
}

/** The `end` snippet for a story's `endContent`, mounting the real HueLegend. */
function end(args: Args) {
  if (args.endContent === 'none') return undefined
  return createRawSnippet(() => ({
    render: () => '<span style="display: contents"></span>',
    setup: (root: Element) => {
      const legend = mount(HueLegend, { target: root, props: { items: args.legendItems } })
      return () => {
        void unmount(legend)
      }
    },
  }))
}

/**
 * The row, a bright `--type-strong` title over a bold rule, that names a group of controls and
 * holds its tabs (the one tab style, ChosenTabs), its hue legend at the right end (`end`) and its
 * page counter. The stories mount the real children (ChosenTabs, HueLegend) into the
 * snippets; their args are grouped by child in the Controls panel.
 */
const meta: Meta<Args> = {
  title: 'Primitives/GroupHeader',
  component: GroupHeader,
  render: (args: Args) => ({
    Component: GroupHeader,
    props: {
      title: args.title,
      detail: args.detail,
      count: args.count,
      level: args.level,
      id: args.id,
      width: args.width,
      children: children(args),
      end: end(args),
      // The story's args map onto GroupHeader's props here; Storybook types `props` as the args.
    } as unknown as Args,
  }),
  args: {
    title: 'Faders',
    content: 'faders',
    pageChosen: 'panel',
    onchoosePage: fn(),
    layerChosen: 'volume',
    onchooseLayer: fn(),
    tipAction: fn(),
    bankChosen: '0',
    onchooseBank: fn(),
    endContent: 'none',
    legendItems: SECTION_LEGEND,
  },
  argTypes: {
    title: { control: 'text' },
    detail: { control: 'text' },
    count: { control: 'object' },
    level: { control: 'inline-radio', options: [2, 3, 4] },
    id: { control: 'text' },
    width: { control: 'number' },
    content: {
      control: 'select',
      options: ['faders', 'knobs', 'pads', 'none'],
      table: { category: 'children' },
    },
    pageChosen: {
      control: 'select',
      options: ['panel', 'style'],
      table: { category: 'ChosenTabs · fader page' },
    },
    onchoosePage: { table: { category: 'ChosenTabs · fader page' } },
    tipAction: { table: { category: 'ChosenTabs · fader page' } },
    layerChosen: {
      control: 'select',
      options: ['volume', 'pan', 'reverb', 'chorus', 'delay'],
      table: { category: 'ChosenTabs · layer' },
    },
    onchooseLayer: { table: { category: 'ChosenTabs · layer' } },
    bankChosen: {
      control: 'select',
      options: ['0', '1', '2', '3', '4', '5'],
      table: { category: 'ChosenTabs · knob page or pad bank' },
    },
    onchooseBank: { table: { category: 'ChosenTabs · knob page or pad bank' } },
    endContent: {
      control: 'inline-radio',
      options: ['legend', 'none'],
      table: { category: 'end' },
    },
    legendItems: { control: 'object', table: { category: 'HueLegend' } },
  },
}

export default meta
type Story = StoryObj<Args>

/**
 * The Faders header: title, the fader page tabs with Panel chosen, the separator, "Layer" and the
 * layer tabs with Vol chosen, both on the one `--neutral` block, over the bold rule.
 */
export const Board: Story = {
  args: { title: 'Faders', width: 646, content: 'faders' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 2, name: 'Faders' })).toBeInTheDocument()
    await expect(await canvas.findByRole('tablist', { name: 'Fader page (master button)' })).toBeInTheDocument()
    await expect(canvas.getByRole('tablist', { name: 'Fader layer' })).toBeInTheDocument()
    await expect(canvas.getByRole('tab', { name: 'Panel' })).toHaveAttribute('data-tip', 'mixer.page')
    await expect(canvas.queryByText(/Page|Bank/)).toBeNull()
    await userEvent.click(canvas.getByRole('tab', { name: 'Style' }))
    await expect(args.onchoosePage).toHaveBeenCalledTimes(1)
    await expect(args.onchoosePage).toHaveBeenCalledWith('style')
    await userEvent.click(canvas.getByRole('tab', { name: 'Pan' }))
    await expect(args.onchooseLayer).toHaveBeenCalledTimes(1)
    await expect(args.onchooseLayer).toHaveBeenCalledWith('pan')
  },
}

/** Knobs and the knob page tabs, Style chosen on the same neutral block as every header's tabs. */
export const Knobs: Story = {
  args: { title: 'Knobs', width: 666, content: 'knobs' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Knobs' })).toBeInTheDocument()
    await expect(await canvas.findByRole('tab', { name: 'Style' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(canvas.getByRole('tab', { name: 'Reverb' }))
    await expect(args.onchooseBank).toHaveBeenCalledWith('3')
  },
}

/**
 * Pads, the pad bank tabs with Sections chosen, and at the right end the five-hue section legend
 * (`end`, where every header's legend goes).
 */
export const Pads: Story = {
  args: { title: 'Pads', width: 666, content: 'pads', endContent: 'legend' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Pads' })).toBeInTheDocument()
    await expect(await canvas.findByRole('tab', { name: 'Sections' })).toHaveAttribute('data-tip', 'padpage.sections')
    const text = canvasElement.textContent ?? ''
    const order = SECTION_LEGEND.map((item) => item.label).map((word) => text.lastIndexOf(word))
    await expect(order.every((at) => at >= 0)).toBe(true)
    await expect([...order].sort((a, b) => a - b)).toEqual(order)
    await expect(text.indexOf('Setup')).toBeLessThan(order[0])
  },
}
