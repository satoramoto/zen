import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { createRawSnippet, mount, unmount, type ComponentProps } from 'svelte'
import { expect, fn, within } from 'storybook/test'
import GoldenGrid from '../Golden/GoldenGrid.svelte'
import SectionRow from './SectionRow.svelte'
import { sectionRowBoard } from './SectionRow.fixtures'

/**
 * A GoldenGrid's cells holding a `cells` SectionRow: the toolbar (the role the parent supplies) is
 * a `display: contents` element, so each control is a grid item, one a cell.
 */
function inGrid(args: ComponentProps<typeof SectionRow>) {
  return createRawSnippet(() => ({
    // Reset's cell is a major third (for `evenKeys`, as the golden Stage sets it).
    render: () =>
      '<div role="toolbar" aria-label="Transport" style="display: contents; --reset-units: var(--interval-major-third)"></div>',
    setup: (root: Element) => {
      const row = mount(SectionRow, { target: root, props: args })
      return () => {
        void unmount(row)
      }
    },
  }))
}

/**
 * The toolbar under the app bar: the transport at the left (Start / Stop, Accomp, Sync Start,
 * Reset, Fill ▲, Fill ▼, Fade), then Metronome with its settings caret, Unison, Panic and help
 * mode's ? at the right. 1392 wide, the screen inside its padding.
 */
const meta = {
  title: 'Components/SectionRow',
  component: SectionRow,
  parameters: { layout: 'centered' },
  args: {
    ...sectionRowBoard,
    tipAction: fn(),
    onstartstop: fn(),
    onaccomp: fn(),
    onsyncstart: fn(),
    onreset: fn(),
    onfillup: fn(),
    onfilldown: fn(),
    onfade: fn(),
    onmetronome: fn(),
    onmetronomesettings: fn(),
    onunison: fn(),
    onpanic: fn(),
    onhelp: fn(),
  },
  argTypes: {
    running: { control: 'boolean', table: { category: 'LampButton' } },
    accomp: { control: 'boolean', table: { category: 'LampButton' } },
    syncStart: { control: 'boolean', table: { category: 'LampButton' } },
    metronome: { control: 'boolean', table: { category: 'LampButton' } },
    unison: { control: 'boolean', table: { category: 'LampButton' } },
    fading: { control: 'boolean', table: { category: 'Button' } },
    metronomeOpen: { control: 'boolean', table: { category: 'Button' } },
    metronomeControls: { control: 'text', table: { category: 'Button' } },
    help: { control: 'boolean', table: { category: 'Button' } },
    groups: { control: { type: 'inline-radio' }, options: ['all', 'transport', 'helpers'] },
    orientation: { control: { type: 'inline-radio' }, options: ['horizontal', 'vertical'] },
    cells: { control: 'boolean' },
    beat: { control: { type: 'number', min: 0, max: 4, step: 1 }, table: { category: 'Cells' } },
    bpm: { control: { type: 'number', min: 40, max: 280, step: 1 }, table: { category: 'Cells' } },
    fillQueued: { control: { type: 'inline-radio' }, options: [undefined, 'up', 'down'], table: { category: 'Cells' } },
    plainQueue: { control: 'boolean', table: { category: 'Cells' } },
    evenKeys: { control: 'boolean', table: { category: 'Cells' } },
    stateLegend: { control: 'boolean', table: { category: 'Cells' } },
    fadeProgress: { control: { type: 'range', min: 0, max: 1, step: 0.05 }, table: { category: 'Cells' } },
    fadeIn: { control: 'boolean', table: { category: 'Cells' } },
  },
} satisfies Meta<typeof SectionRow>

export default meta
type Story = StoryObj<typeof meta>

/** The dark board: stopped, Accomp lit, every other switch and helper off. */
export const Board: Story = {}

/**
 * Running: each switch is a dot and a word, the dot filled in its hue when on and a hollow ring
 * when off; actions are plain words; Start / Stop reads "● Playing" in the running hue.
 */
export const Running: Story = {
  args: { running: true },
}

/**
 * The transport alone as a list (`groups` transport, `orientation` vertical), as in the golden
 * Stage's transport block: "● Playing", Accomp, Sync Start, Reset, "Fill ▲  Fill ▼" on one line, Fade.
 */
export const VerticalTransport: Story = {
  args: { running: true, groups: 'transport', orientation: 'vertical' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('toolbar', { name: 'Transport' })).toHaveAttribute('aria-orientation', 'vertical')
    await expect(canvas.queryByRole('button', { name: 'Panic: all notes off' })).toBeNull()
    await expect(canvas.getAllByRole('button')).toHaveLength(7)
  },
}

/** The helpers alone (`groups` helpers), as in the golden Stage's app bar: Metronome ▾, Unison, Panic, ?. */
export const Helpers: Story = {
  args: { groups: 'helpers', metronome: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('toolbar', { name: 'Helpers' })).toBeInTheDocument()
    await expect(canvas.queryByRole('group', { name: 'Transport' })).toBeNull()
  },
}

/** The transport's seven cells, weighted as on the golden Stage (Start / Stop phi², Reset's cell a major third). */
function transportGrid(args: ComponentProps<typeof SectionRow>) {
  return {
    // GoldenGrid hosts the story; Storybook types `Component` and `props` as SectionRow's.
    Component: GoldenGrid as unknown as typeof SectionRow,
    props: {
      weights: ['phi2', 'unison', 'unison', 'unison', 'unison', 'unison', 'major-third'],
      overlay: true,
      name: 'Transport',
      children: inGrid(args),
    } as unknown as typeof args,
  }
}

/** How many glyphs each transport key draws. */
const glyphCount = (toolbar: Element) => [...toolbar.querySelectorAll('.band')].map((b) => b.querySelectorAll('svg').length)

/**
 * The transport in cells (`cells`, `groups` transport) in a 7-cell GoldenGrid, its cuts drawn: no
 * wrapper, each control one key filling its cell, in the hue of time (cyan), a glyph over its
 * word, every word on one baseline, grouped by job: [Start / Stop · Sync Start] [Accomp] [Fill Up
 * · Fill Down · Fade] [Reset], a fib-8 inside a group, a fib-13 between groups. Running: Start /
 * Stop solid with ■ (its legend always "Start / Stop"), Sync Start outlined (a bar before ▶),
 * Accomp solid (a chord stack), Fill Up ▲ and Fill Down ▼ each its own key and word, Fade ◣ (a
 * press fades out), then ⟲ Reset at the far end behind its gutter. The grid's toolbar element
 * supplies the role.
 */
export const Cells: Story = {
  args: { running: true, accomp: true, groups: 'transport', cells: true },
  parameters: { sample: { width: 700, height: 55 } },
  render: (args) => transportGrid(args),
  play: async ({ canvasElement }) => {
    const toolbar = within(canvasElement).getByRole('toolbar', { name: 'Transport' })
    const controls = [...toolbar.children]
    await expect(controls).toHaveLength(7)
    await expect(toolbar.parentElement).toHaveAttribute('data-golden-slots', 'grid')
    // Start / Stop's legend is the action; the glyph, the solid fill and the spoken name the state.
    await expect(controls[0]).toHaveAccessibleName(/^Playing: Start \/ Stop/)
    await expect(controls[0]).toHaveAttribute('aria-pressed', 'true')
    await expect(controls.map((c) => c.textContent?.trim())).toEqual([
      'Start / Stop',
      'Sync Start',
      'Accomp',
      'Fill Up',
      'Fill Down',
      'Fade',
      'Reset',
    ])
    await expect(controls.map((c) => c.getAttribute('data-face'))).toEqual(['on', 'off', 'on', 'off', 'off', 'off', 'off'])
    // A glyph on every key, one each.
    await expect(glyphCount(toolbar)).toEqual([1, 1, 1, 1, 1, 1, 1])
    await expect(controls[5]).toHaveAccessibleName('Fade out')
    await expect(controls[6]).toHaveAccessibleName('Section reset: restart the section from its first bar')
    await expect(canvasElement.querySelector('.group, .pair, .start-word, .row, .dot')).toBeNull()
  },
}

/**
 * Stopped: Start / Stop outlined with ▶ (one glyph: what a press does), Sync Start armed (a 2px
 * ring, pulsing at the tempo while no beat comes), Fade armed with ◢ (a fade-in waiting for Start).
 */
export const CellsStopped: Story = {
  args: { running: false, syncStart: true, fading: true, bpm: 104, groups: 'transport', cells: true },
  parameters: { sample: { width: 700, height: 55 } },
  render: (args) => transportGrid(args),
  play: async ({ canvasElement }) => {
    const controls = [...within(canvasElement).getByRole('toolbar', { name: 'Transport' }).children]
    await expect(controls[0]).toHaveAttribute('data-face', 'off')
    await expect(controls[0]).toHaveAttribute('aria-pressed', 'false')
    await expect(controls[1]).toHaveAttribute('data-face', 'armed')
    await expect(controls[1]).toHaveAttribute('data-pulse', 'free')
    await expect(controls[1]).toHaveAccessibleName(/^Sync Start, armed/)
    await expect(controls[5]).toHaveAttribute('data-face', 'armed')
    await expect(controls[5]).toHaveAccessibleName('Fade in, waiting for Start')
  },
}

/**
 * Running, mid-phrase: Fill Up queued (armed, its ring pulsing once on each beat, in step with the
 * beat bar: the pulse restarts as `beat` changes) and a fade-out under way, Fade solid with its
 * wedge drained by `fadeProgress` (40% gone).
 */
export const CellsQueued: Story = {
  args: {
    running: true,
    accomp: true,
    fillQueued: 'up',
    fading: true,
    fadeProgress: 0.4,
    beat: 3,
    bpm: 104,
    groups: 'transport',
    cells: true,
  },
  parameters: { sample: { width: 700, height: 55 } },
  render: (args) => transportGrid(args),
  play: async ({ canvasElement }) => {
    const controls = [...within(canvasElement).getByRole('toolbar', { name: 'Transport' }).children]
    await expect(controls[3]).toHaveAttribute('data-face', 'armed')
    await expect(controls[3]).toHaveAttribute('data-pulse', 'a')
    await expect(controls[3]).toHaveAccessibleName(/^Fill Up, queued/)
    await expect(controls[4]).toHaveAttribute('data-face', 'off')
    await expect(controls[5]).toHaveAttribute('data-face', 'on')
    await expect(controls[5].querySelector('svg')).toHaveAttribute('data-drain', '0.60')
  },
}

/**
 * As the golden Stage draws it (designer pass): Fill Up queued but plain off (`plainQueue`: a fill
 * is never latched, so the queue is said in its name, not shown as a third face), and the six keys
 * after Start / Stop one width a fib-8 apart, every glyph a 21px square on one foot (`evenKeys`).
 */
export const CellsEven: Story = {
  args: {
    running: true,
    accomp: true,
    fillQueued: 'up',
    plainQueue: true,
    evenKeys: true,
    beat: 3,
    bpm: 104,
    groups: 'transport',
    cells: true,
  },
  parameters: { sample: { width: 700, height: 55 } },
  render: (args) => transportGrid(args),
  play: async ({ canvasElement }) => {
    const controls = [...within(canvasElement).getByRole('toolbar', { name: 'Transport' }).children]
    await expect(controls[3]).toHaveAttribute('data-face', 'off')
    await expect(controls[3]).not.toHaveAttribute('data-pulse')
    await expect(controls[3]).toHaveAccessibleName(/^Fill Up, queued/)
    for (const key of controls.slice(1)) await expect(key.classList.contains('even')).toBe(true)
    await expect(controls[0].classList.contains('even')).toBe(false)
    // Real layout only (jsdom has none): one width, a fib-8 apart, 21px glyphs on one foot.
    const boxes = controls.map((c) => c.getBoundingClientRect())
    if (boxes[0].width === 0) return
    for (let i = 1; i < boxes.length; i++) {
      await expect(Math.round(boxes[i].left - boxes[i - 1].right)).toBe(8)
      await expect(Math.abs(boxes[i].width - boxes[1].width)).toBeLessThan(0.5)
    }
    const marks = controls.map((c) => c.querySelector('.mark')?.getBoundingClientRect())
    for (const m of marks) {
      await expect([Math.round(m?.width ?? 0), Math.round(m?.height ?? 0)]).toEqual([21, 21])
      await expect(Math.abs((m?.bottom ?? 0) - (marks[0]?.bottom ?? 0))).toBeLessThan(0.5)
    }
  },
}

/**
 * Start / Stop says what the band is doing (`stateLegend`): "Stopped" here, outlined with ▶;
 * "Playing" while running, solid with ■. Its spoken name still names the control.
 */
export const CellsStateLegend: Story = {
  args: { running: false, stateLegend: true, evenKeys: true, groups: 'transport', cells: true },
  parameters: { sample: { width: 700, height: 55 } },
  render: (args) => transportGrid(args),
  play: async ({ canvasElement }) => {
    const start = within(canvasElement).getByRole('toolbar', { name: 'Transport' }).children[0]
    await expect(start.querySelector('.key-word')?.textContent).toBe('Stopped')
    await expect(start).toHaveAttribute('data-face', 'off')
    await expect(start).toHaveAccessibleName(/^Stopped: Start \/ Stop/)
  },
}

/** A toolbar laying the helpers out as max-content columns, the grid a `cells` row sits in. */
function inColumns(args: ComponentProps<typeof SectionRow>) {
  return createRawSnippet(() => ({
    render: () =>
      '<div role="toolbar" aria-label="Helpers" style="display: grid; grid-auto-flow: column; grid-auto-columns: max-content; height: 100%"></div>',
    setup: (root: Element) => {
      const row = mount(SectionRow, { target: root, props: args })
      return () => {
        void unmount(row)
      }
    },
  }))
}

/**
 * The helpers in cells (`cells`, `groups` helpers) in max-content columns: Metronome with its ▾ as
 * two halves of one outlined cell in the hue of time (lit: on), Unison and ? in the lamp's lime,
 * then Panic in the warning hue, set apart. No white outlines.
 */
export const HelperCells: Story = {
  args: { metronome: true, groups: 'helpers', cells: true },
  parameters: { sample: { width: 610, height: 34 } },
  render: (args) => ({
    // GoldenGrid hosts the story; Storybook types `Component` and `props` as SectionRow's.
    Component: GoldenGrid as unknown as typeof SectionRow,
    props: { columns: 1, name: 'Helpers', children: inColumns(args) } as unknown as typeof args,
  }),
  play: async ({ canvasElement }) => {
    const toolbar = within(canvasElement).getByRole('toolbar', { name: 'Helpers' })
    const controls = [...toolbar.children]
    await expect(controls).toHaveLength(4)
    const metronome = within(toolbar).getByRole('group', { name: 'Metronome' })
    await expect(controls[0]).toBe(metronome)
    const halves = within(metronome).getAllByRole('button')
    await expect(halves).toHaveLength(2)
    await expect(halves[0]).toHaveAttribute('data-face', 'on')
    await expect(halves[0]).toHaveAttribute('data-hue', 'transport')
    await expect(controls[1]).toHaveTextContent('Unison')
    await expect(controls[1]).toHaveAttribute('data-hue', 'lamp')
    await expect(controls[2]).toHaveTextContent('?')
    await expect(controls[3]).toHaveAccessibleName('Panic: all notes off')
  },
}

/** Stopped, with Sync Start, Fade, Metronome (settings open), Unison and help on. */
export const AllOn: Story = {
  args: {
    running: false,
    syncStart: true,
    fading: true,
    metronome: true,
    metronomeOpen: true,
    unison: true,
    help: true,
  },
}
