import type { Meta, StoryObj } from '@storybook/svelte-vite'
import { createRawSnippet } from 'svelte'
import { expect, fn, waitFor } from 'storybook/test'
import Stage from './Stage.svelte'
import { stageBoard, stageStopped } from './Stage.fixtures'
import StagePlayground from './StagePlayground.svelte'

/** Groups a callback's control under its component. */
const on = (category: string, names: string[]) =>
  Object.fromEntries(names.map((name) => [name, { table: { category } }]))

const CALLBACKS: Record<string, string[]> = {
  AppBar: ['onchoose', 'onhealth'],
  SectionRow: [
    'onstartstop',
    'onaccomp',
    'onsyncstart',
    'onreset',
    'onfillup',
    'onfilldown',
    'onfade',
    'onmetronome',
    'onmetronomesettings',
    'onunison',
    'onpanic',
    'onhelp',
  ],
  Display: [
    'onprev',
    'onnext',
    'onbrowse',
    'ononetouch',
    'onsound',
    'ontempoup',
    'ontempodown',
    'onstyletempo',
    'ontempo',
    'ontaptempo',
  ],
  FaderBank: [
    'onchoosePage',
    'onchooseLayer',
    'onlevel',
    'onopen',
    'onlamp',
    'onlamplong',
    'onlamprelease',
    'onpagebutton',
    'onpagelong',
    'onpagerelease',
  ],
  KnobBank: ['onknobpage', 'onknobpress', 'onstep'],
  PadBank: ['onpadbank', 'onpadpress'],
  StatusLine: ['onclear'],
  // Accepted so the wiring branch still type-checks; nothing on the Stage calls them now.
  Unused: ['onstop', 'onstoplong', 'onpageup', 'onpagedown', 'onbankup', 'onbankdown', 'onsends', 'onrack', 'onpart'],
}

const actions = Object.fromEntries(Object.values(CALLBACKS).flatMap((names) => names.map((name) => [name, fn()])))

/**
 * The Stage page at the app's 1440 × 900: the app bar, the section row (transport at its left), the
 * display in thirds (harmony, song, parts), the hardware band (faders; knobs above pads), the
 * status line and the keys. Each region's data is
 * one object control; every callback is an action, grouped under its component.
 */
const meta = {
  title: 'Screens/Stage',
  component: Stage,
  parameters: { layout: 'fullscreen' },
  args: { ...stageBoard, tipAction: fn(), ...actions },
  argTypes: {
    layout: { control: 'inline-radio', options: ['grid', 'golden'], table: { category: 'Layout' } },
    overlay: { control: 'boolean', table: { category: 'Layout' } },
    appBar: { control: 'object', table: { category: 'AppBar' } },
    sectionRow: { control: 'object', table: { category: 'SectionRow' } },
    display: { control: 'object', table: { category: 'Display' } },
    faders: { control: 'object', table: { category: 'FaderBank' } },
    knobs: { control: 'object', table: { category: 'KnobBank' } },
    pads: { control: 'object', table: { category: 'PadBank' } },
    status: { control: 'object', table: { category: 'StatusLine' } },
    keys: { control: 'object', table: { category: 'Keys' } },
    ...Object.assign({}, ...Object.entries(CALLBACKS).map(([category, names]) => on(category, names))),
  },
} satisfies Meta<typeof Stage>

export default meta
type Story = StoryObj<typeof meta>

/** The dark board: Am7 in Main B, Main C next, running at 104; split F#2 with the left hand's Am7 held. */
export const Board: Story = {}

/** Stopped with a style queued, the faders on the Reverb layer, a message on the status line. */
export const Stopped: Story = {
  args: { ...stageStopped },
}

/**
 * Play with the screen: the controls respond. It starts from the board, and a story-only wrapper
 * (`StagePlayground.svelte`) keeps what you change; editing a control re-seeds that region. Every
 * press still logs in the Actions panel.
 *
 * - Page tabs, fader page and layer tabs, and the Panel page button switch; on a layer other than
 *   Vol, strips 1–4 show that layer's values ("Rev 40", "Pan L24"), each layer keeping its own.
 * - The knob page tabs switch the eight knobs (each page keeps its own values); the pad bank tabs
 *   switch the sixteen pads (Sections is the stateful one; the other banks' pads toggle).
 * - Faders drag, knobs turn (the Tempo knob is the tempo), lamps toggle: Accomp, Sync Start (the
 *   same switch as pad 4), Metronome (and its ▾), Unison, ?, the part lamps (an Off part dims its
 *   strip and sound) and the function lamps.
 * - Pads, no timers: stopped, a Main or Break plays at once, an Intro or Ending arms. Running, a
 *   section pad is queued (NEXT); press it again and it lands; a landed Ending stops the band. Start
 *   plays the armed pad and queues the Main that was playing; Stop clears what was queued or armed.
 *   Auto Fill and Sync Stop toggle.
 * - Start / Stop (the section row's or pad 16) swaps the display between the board and the stopped
 *   display; while running, a story-only ticker in this wrapper moves the beat bar at the tempo
 *   (the components hold no timers). Fade toggles; Reset and Fill ▲ ▼ write a status line.
 * - Tempo: + and − on the display step it, dragging or scrolling on the number sets it, ↑ ↓ step it
 *   with focus, and a double-click goes back to the style's 104.
 * - One Touch applies, ‹ › step through a few styles (a 3/4 waltz among them: three beat segments),
 *   a part's row steps through a few sounds, Panic writes a status line, a click clears it.
 */
export const Playground: Story = {
  render: (args) => ({ Component: StagePlayground, props: args }),
}

/**
 * The board with `overlay` on: the layout grid every region sits on.
 *
 * - **The grid** (tokens/grid.css): 15 columns of 76px with an 18px gutter inside the 24px margins
 *   (15 divides into thirds and fifths), and a 6px rhythm (900 = 150 × 6; the margin is 4 units,
 *   the gutter 3).
 * - **Rows**, in rhythm units: margin 4, app bar 6, gap 2, section row 4, gap 2, display 48, gap 4,
 *   band 62, status line 4, keys 10, margin 4.
 * - **Section row** (`look: 'dots'`): a dot and a word per switch, plain words for actions,
 *   "● Playing" / "○ Stopped". The transport starts on column 1; the helpers end on column 15.
 * - **Display**: the thirds are exactly columns 1-5, 6-10 and 11-15, with one top line for the
 *   style line, the section and the first part row; the beat bar spans 1-15.
 * - **Band**: faders on columns 1-9 (3/5), one strip per column; knobs over pads on 10-15 (2/5).
 *   Every header starts on a column line.
 * - **Keys**: the full width, margin to margin.
 */
export const Grid: Story = {
  args: { overlay: true },
}

/** A placeholder page for the slot: a dashed box that fills `--page-width` × `--page-height`. */
const placeholderPage = createRawSnippet(() => ({
  render: () =>
    `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; box-sizing: border-box; width: var(--page-width); height: var(--page-height); border: 1px dashed var(--d); color: var(--m); font-size: 14px;">` +
    `<strong style="color: var(--t); font-size: 20px; font-weight: 400;">Page slot</strong>` +
    `<span>A display page fills this box: --page-width × --page-height (1392 × 288).</span></div>`,
}))

/**
 * A display page in the Stage's display box (`page`, a snippet), in place of the Display: here a
 * placeholder. The app bar, section row, band, status line and keys stay as on the Stage; the band
 * never changes height. The box sets `--page-width` and `--page-height` for the page to lay out
 * against (1392 × 288 on the grid). The app passes Channel, Effects, Quick Racks, Multi Pads, Looper
 * or Harm/Arp here (panels/stage/StageScreen.svelte).
 */
export const PageSlot: Story = {
  name: 'Page slot',
  args: { page: placeholderPage, appBar: { ...stageBoard.appBar, chosen: 'effects' } },
}

/**
 * A proposal: the Stage laid out as a Golden tree (`layout="golden"`, StageGolden, built from the
 * Golden primitives), here at 1440 × 900. Every size comes from a cut, and the cuts recurse: the page
 * lays out groups, each group lays out its items, each control is a frame again. Turn on `overlay`
 * to see every level.
 *
 * The geometry is the owner's wireframe:
 *
 * - **Frame**: 1398 wide between fib-21 side margins, a fib-21 foot, the app bar (36, the page
 *   tabs, the helpers Metronome ▾, Unison, Panic, ?, the Launchkey and audio health) on the top
 *   edge, a fib-8 under it.
 * - **Controls row** (52, a control-height band a golden step deeper), a fib-13 over the display,
 *   laid out from the owner's mockup in our face: one outlined box 36 deep holding the style line
 *   (‹ Sunday Drive Pop › Pop & Rock · 4/4), a hairline and One Touch in the style's violet. The
 *   display's sides run up to it: one frame.
 * - **Transport** at the Pads header's right end, beside the pads as on the Launchkey: seven square
 *   icon keys in the hue of time (cyan): ▶ (solid while playing), Sync Start (loop arrows), Accomp
 *   (a note), Fill ▲, Fill ▼, Fade (falling bars), Reset (⟲), their words in their names and
 *   tooltips; armed keys pulse on the beat, a queued Fill stays plain off, its queue in its name.
 * - **Display** (1398 × 304: three phi boxes across, plus the 16 of the controls band the row
 *   leaves), the mockup's hero panel: the chord, section
 *   and tempo columns split by hairlines; the three values bold at one size (0.549 of the panel's
 *   height), centred, their capitals on one line, each measured down to fit; under them "A · C ·
 *   E · G … Fingered On Bass", "Next … Main C … fill after bar 4" and − Tap + (unboxed, boxed on
 *   hover); BPM on 104's baseline; the beat bar across the panel's foot in the hue of time. No
 *   parts list: each part's sound is on its strip.
 * - **Band** (1398 × 384, a fib-21 under the display), two equal halves with a fib-21 gutter: the
 *   faders (a header band over nine strips, each with its own foot: part lamps, then the functions
 *   and the page button; a parked strip a dotted ghost) and, on the right, the knobs (a header band
 *   over eight cells of one width, each dial the cell over phi) over the pads (a header band over
 *   2 × 8 pads at 6:5; the queued pad's NEXT a corner tag).
 * - **Status line** a fib-5 under the band, then the **keys** (56, the black keys 56 / phi).
 */
export const Golden: Story = {
  args: { layout: 'golden', overlay: false },
}

/**
 * The golden layout with `overlay` on: a GoldenOverlay draws every level's cuts, each nesting depth
 * in its own shade, each leaf's inset (dashed) and a spiral in every phi box and golden cut, turned
 * to its cut's side; it draws red whatever breaks a rule (a row whose cells don't add up, a slot
 * whose content overflows).
 */
export const GoldenOverlay: Story = {
  name: 'Golden › overlay',
  args: { layout: 'golden', overlay: true },
  play: async ({ canvasElement }) => {
    const overlay = canvasElement.querySelector('[data-golden="overlay"]')
    await expect(overlay).not.toBeNull()
    await waitFor(() => expect(overlay?.getAttribute('data-rows-off')).toBe('0'))
    // The wireframe's stack: the app bar's band, the controls row a control-height band a golden
    // step deeper, the display three phi boxes across, the pads two rows of eight 6:5 pads.
    const bandOf = (name: string) => canvasElement.querySelector(`[data-golden-name="${name}"] [data-golden-slots]`)
    await expect(bandOf('page')?.getAttribute('data-band')).toBe('bar-height')
    await expect([bandOf('controls')?.getAttribute('data-band'), bandOf('controls')?.getAttribute('data-times')]).toEqual([
      'control-height',
      'phi',
    ])
    await expect([bandOf('display and band')?.getAttribute('data-take'), bandOf('display and band')?.getAttribute('data-boxes')]).toEqual([
      'phi',
      '3',
    ])
    await expect([bandOf('knobs and pads')?.getAttribute('data-take'), bandOf('knobs and pads')?.getAttribute('data-boxes')]).toEqual([
      'minor-third',
      '4',
    ])
    // The hero panel: the chord, section and tempo columns.
    const hero = canvasElement.querySelector('[data-hero]')
    await expect(hero?.querySelectorAll(':scope > .col').length).toBe(3)
    const controls = canvasElement.querySelector('.leaf.controls .row')
    // The display holds no parts list: each part's sound is on its fader strip.
    await expect(hero?.querySelector('[aria-label$="Opens the quick sound list"]')).toBeNull()
    const strips = canvasElement.querySelector('[data-golden-name="strips"]')
    await expect(strips?.querySelectorAll('[aria-label$="Opens the quick sound list"]').length).toBe(4)
    // The transport, at the Pads header's right end (beside the pads, as on the Launchkey): seven
    // icon keys, no words on them: each says what it is in its name (Start / Stop's what the band
    // is doing, "Playing") and its tooltip.
    const transport = canvasElement.querySelector('[role="toolbar"][aria-label="Transport"]')
    const padsHeader = canvasElement.querySelector('[data-golden-name="pads"] .header')
    await expect(padsHeader?.contains(transport)).toBe(true)
    const keys = [...(transport?.querySelectorAll('button') ?? [])]
    await expect(keys).toHaveLength(7)
    await expect(keys.map((key) => key.textContent?.trim())).toEqual(['', '', '', '', '', '', ''])
    await expect(keys.map((key) => key.querySelector('svg.icon')?.getAttribute('data-icon'))).toEqual([
      'start',
      'sync',
      'accomp',
      'fill-up',
      'fill-down',
      'fade',
      'reset',
    ])
    await expect(keys[0]).toHaveAccessibleName(/^Playing: Start \/ Stop/)
    await expect(keys[0]).toHaveAttribute('data-face', 'on')
    for (const key of keys) await expect(key.getAttribute('data-tip')).toMatch(/^transport\./)
    await expect(transport?.lastElementChild?.getAttribute('aria-label')).toMatch(/^Section reset/)
    // The controls row: the style line, a hairline and One Touch (its caption, then 1–4).
    await expect([...(controls?.children ?? [])].map((c) => c.className.split(' ')[0])).toEqual(['style', 'rule', 'one-touch'])
    await expect(controls?.querySelector('.style [aria-label="Previous style (Track left)"]')).not.toBeNull()
    const oneTouch = canvasElement.querySelector('.one-touch')
    await expect(oneTouch?.firstElementChild?.tagName).toBe('SPAN')
    await expect(oneTouch?.querySelectorAll('button')).toHaveLength(4)
    // − Tap + under the tempo, in its column; the beat bar has no numbers.
    const tempoLine = [...(hero?.querySelectorAll('.tempo-col button') ?? [])].map((b) => b.getAttribute('aria-label'))
    await expect(tempoLine).toEqual(expect.arrayContaining(['Tempo up (Scene Launch)', 'Tempo down (Function)', 'Tap tempo']))
    await expect(hero?.querySelector('.beat')?.textContent?.trim()).toBe('')
    // Each strip carries its own foot (one module a strip): nine strips, nine lamps or buttons.
    const stripGrid = canvasElement.querySelector('[data-golden-name="strips"] [data-golden-slots="grid"]')
    await expect(stripGrid?.children.length).toBe(9)
    for (const strip of stripGrid?.children ?? []) await expect(strip.querySelector('[data-band="control-height"] button')).not.toBeNull()
    // What comes next, spread across the section's column: "Next", Main C in its hue, when it
    // lands; not a control: no outline, no button.
    const next = canvasElement.querySelector('[aria-label="Next section"]')
    await expect([...(next?.children ?? [])].map((c) => c.textContent)).toEqual(['Next', 'Main C', 'fill after bar 4'])
    await expect(next?.querySelector('[data-hue="main"]')?.textContent).toBe('Main C')
    await expect(next?.querySelector('button, [data-face]')).toBeNull()
    // The queued pad keeps one line: NEXT is a corner tag, not a line over "Main C".
    await expect(canvasElement.querySelector('[data-golden-name="pad grid"] .tag.corner')?.textContent).toBe('NEXT')
    // The style's category and metre follow its name on the style line.
    await expect(controls?.querySelector('.style .name + .glyph + .meta')?.textContent).toBe('Pop & Rock · 4/4')
    // The knobs: every cell one width, assigned or not; each value under its dial (not in the
    // ring) and the name on one line under it.
    const knobRow = canvasElement.querySelector('[data-golden-name="knob row"] [data-golden-slots="grid"]')
    await expect(knobRow?.getAttribute('data-weights')).toBe('unison unison unison unison unison unison unison unison')
    for (const knob of knobRow?.children ?? []) {
      await expect(knob.querySelector('[data-band="label-lines-2"]')).toBeNull()
      await expect(knob.querySelector('.ring-value')).toBeNull()
      await expect(knob.querySelector('.text.value')).not.toBeNull()
    }
    // A parked strip is a dotted ghost in the faded hue: no track, no meter rails.
    const parked = stripGrid?.querySelectorAll('.fader[data-kind="parked"]')
    await expect(parked?.length).toBe(2)
    for (const fader of parked ?? []) {
      await expect(fader.classList.contains('empty')).toBe(true)
      await expect(fader.querySelector('.meter-bg')).toBeNull()
    }
    // Real layout only (jsdom has none): the wireframe's blocks; the mockup's hero panel and
    // transport row.
    const plus = canvasElement.querySelector('[aria-label="Tempo up (Scene Launch)"]')?.getBoundingClientRect()
    if (plus && plus.height > 0) {
      const rect = (name: string) => canvasElement.querySelector(`[data-golden-name="${name}"]`)!.getBoundingClientRect()
      const box = (sel: string) => canvasElement.querySelector(sel)!.getBoundingClientRect()
      // The display three phi boxes across plus the part of the controls band the row leaves (52
      // less the row's 36), a fib-13 under the row; the band's halves equal, a fib-21 apart; the
      // band where and as deep as before (384 at 1440: it takes what the fixed rows leave).
      const display = box('[data-hero]')
      const rowBox = box('.leaf.controls .row')
      await expect(Math.round(rowBox.height)).toBe(36)
      await expect(Math.round(display.top - rowBox.bottom)).toBe(13)
      await expect(display.height - display.width / (3 * 1.618)).toBeCloseTo(32 * 1.618 - 36, 0)
      await expect(Math.round(rect('band').top - display.bottom)).toBe(21)
      const [faders, right] = [rect('faders'), rect('knobs and pads')]
      await expect(Math.abs(faders.width - right.width)).toBeLessThan(1)
      await expect(Math.round(right.left - faders.right)).toBe(21)
      await expect(Math.round(rect('controls').top - rect('page').top - 36)).toBe(8)
      if (display.width > 1390) await expect(Math.round(rect('band').height)).toBe(384)
      // The pads 6:5, two rows of eight.
      const cell = canvasElement.querySelector('[data-golden-name="pad grid"] .pad')!.getBoundingClientRect()
      await expect(cell.width / cell.height).toBeCloseTo(1.2, 1)
      // The mockup's columns: the chord a third of the panel, the section a little wider, the
      // tempo the rest; the hairlines stop over the beat bar.
      const inner = display.width - 2
      const cols = ['.chord-col', '.section-col', '.tempo-col'].map((c) => box(`[data-hero] ${c}`))
      await expect(cols[0].width / inner).toBeCloseTo(0.329, 2)
      await expect(cols[1].width / inner).toBeCloseTo(0.354, 2)
      await expect(cols[2].width / inner).toBeCloseTo(0.317, 2)
      const bar = box('[data-hero] .beat .bar')
      await expect(bar.top).toBeGreaterThan(cols[0].bottom)
      // The hero values bold at one size (0.549 of the panel's height), Main B and 104 at most that.
      const style = (sel: string) => getComputedStyle(canvasElement.querySelector(sel)!)
      const heroSize = (display.height - 1) * 0.549
      await expect(parseFloat(style('.chord-col .readout .chord').fontSize)).toBeCloseTo(heroSize, 0)
      await expect(parseFloat(style('.tempo-col .bpm').fontSize)).toBeLessThanOrEqual(heroSize + 0.5)
      await expect(parseFloat(style('.section-col .stand .name').fontSize)).toBeLessThanOrEqual(heroSize + 0.5)
      for (const sel of ['.chord-col .readout .chord', '.tempo-col .bpm', '.section-col .stand .name'])
        await expect(style(sel).fontWeight).toBe('700')
      // Their capitals on one line, each centred in its column; the lines under the chord and the
      // section on one baseline.
      const tops = ['.chord-col .readout .chord', '.section-col .stand .name', '.tempo-col .bpm'].map((s) => box(s).top)
      for (const t of tops) await expect(Math.abs(t - tops[0])).toBeLessThan(1)
      const centre = (r: DOMRect) => (r.left + r.right) / 2
      const range = (sel: string) => {
        const r = document.createRange()
        r.selectNodeContents(canvasElement.querySelector(sel) as Node)
        return r.getBoundingClientRect()
      }
      await expect(Math.abs(centre(range('.chord-col .readout .chord')) - centre(cols[0]))).toBeLessThan(2)
      await expect(Math.abs(centre(box('.section-col .stand .name')) - centre(cols[1]))).toBeLessThan(2)
      const feet = ['.chord-col .readout .line > *', '.section-col .sub > *'].map((s) => box(s).bottom)
      await expect(Math.abs(feet[1] - feet[0])).toBeLessThan(1)
      // Main B measured to the largest size that fits its column (once its fit has run); the
      // chord and the section read as two words.
      await waitFor(() => expect(box('.section-col .stand .name').right).toBeLessThanOrEqual(cols[1].right - 21 + 1))
      const section = box('.section-col .stand .name')
      const chordText = document.createRange()
      chordText.selectNodeContents(canvasElement.querySelector('.chord-col .readout .chord') as Node)
      await expect(section.left - chordText.getBoundingClientRect().right).toBeGreaterThanOrEqual(21)
      // BPM on 104's baseline, a fib-8 after it; − Tap + on one line under them, left to right,
      // inside the tempo's column, each a fib-55 × control-height hit area, unboxed at rest.
      await expect(Math.abs(box('.tempo-col .unit').bottom - box('.tempo-col .bpm').bottom)).toBeLessThan(1)
      await expect(Math.round(box('.tempo-col .unit').left - box('.tempo-col .bpm').right)).toBe(8)
      const tap = box('.tempo-col .tap')
      const minus = box('[aria-label="Tempo down (Function)"]')
      for (const k of [minus, tap, plus]) {
        await expect([Math.round(k.width), Math.round(k.height)]).toEqual([55, 32])
        await expect(Math.abs(k.top - tap.top)).toBeLessThan(1)
        await expect(k.left).toBeGreaterThanOrEqual(cols[2].left)
        await expect(k.right).toBeLessThanOrEqual(cols[2].right)
      }
      await expect(minus.right).toBeLessThan(tap.left)
      await expect(tap.right).toBeLessThan(plus.left)
      await expect(style('.tempo-col .tap').boxShadow).toBe('none')
      // Each part's sound centred over its own strip, at most the strip less 6px, wrapping to two
      // 13px lines ("Brass Section" whole on two) before any ellipsis.
      for (const strip of [...(stripGrid?.children ?? [])].slice(0, 4)) {
        const s = strip.getBoundingClientRect()
        const text = strip.querySelector('.sound .lines') as HTMLElement
        const t = text.getBoundingClientRect()
        await expect(t.width).toBeLessThanOrEqual(s.width - 6 + 0.5)
        await expect(Math.abs((t.left + t.right) / 2 - (s.left + s.right) / 2)).toBeLessThan(1)
        await expect(getComputedStyle(text).fontSize).toBe('13px')
        await expect(text.scrollHeight).toBeLessThanOrEqual(text.clientHeight + 1)
      }
      // The transport keys: square, one size (the header's 0.046 wide, at most 32), a fib-2
      // apart, flush with the Pads header's right end, inside it above its rule, clear of the
      // last bank tab.
      const header = (padsHeader as HTMLElement).getBoundingClientRect()
      const k = keys.map((key) => key.getBoundingClientRect())
      for (const r of k) {
        await expect(Math.abs(r.width - r.height)).toBeLessThan(0.5)
        await expect(Math.abs(r.width - k[0].width)).toBeLessThan(0.5)
        await expect(r.top).toBeGreaterThanOrEqual(header.top)
        await expect(r.bottom).toBeLessThanOrEqual(header.bottom - 2)
      }
      await expect(k[0].width).toBeCloseTo(Math.min(header.width * 0.046, 32), 0)
      await expect(k.slice(1).map((r, i) => Math.round(r.left - k[i].right))).toEqual([2, 2, 2, 2, 2, 2])
      await expect(Math.abs(k[6].right - header.right)).toBeLessThan(1)
      const tabs = [...(padsHeader?.querySelectorAll('[role="tab"], button') ?? [])].filter((b) => !transport?.contains(b))
      await expect(k[0].left).toBeGreaterThan(tabs.at(-1)!.getBoundingClientRect().right)
      // The controls row: One Touch flush right a fib-3 in; the style's name whole.
      const lastNumber = [...(oneTouch?.querySelectorAll('button') ?? [])].at(-1)!.getBoundingClientRect()
      await expect(Math.round(rowBox.right - lastNumber.right)).toBe(4)
      const name = canvasElement.querySelector('.controls .style .name') as HTMLElement
      await expect(name.scrollWidth).toBeLessThanOrEqual(name.clientWidth)
      // The beat bar: each bar the panel's 0.064 deep.
      await expect(bar.height).toBeCloseTo((display.height - 1) * 0.064, 0)
    }
    // On the board Main C lands after a fill, so Fill Up is queued: said in its name, its face
    // plain off (designer pass: no third state).
    await expect(keys[3]).toHaveAttribute('data-face', 'off')
    await expect(keys[3]).toHaveAccessibleName(/^Fill Up, queued/)
    for (const key of keys) await expect((key as HTMLElement).style.getPropertyValue('--hue')).toBe('var(--transport)')
    // One hue a meaning, shared with the pads: the Sections bank's utility pads (the transport's
    // twins) in the hue of time, Start / Stop too; One Touch in the style's violet; the function
    // lamps and the page button in the lamp's lime; nothing clickable outlined white.
    const padGrid = canvasElement.querySelector('[data-golden-name="pad grid"]')
    const twins = [...(padGrid?.querySelectorAll('button') ?? [])].filter((b) =>
      ['Sync Start', 'Auto Fill', 'Tap', 'Sync Stop'].includes(b.textContent?.trim() ?? ''),
    )
    await expect(twins).toHaveLength(4)
    for (const pad of twins) await expect(pad).toHaveAttribute('data-hue', 'transport')
    await expect(padGrid?.querySelector('[aria-label^="Start / Stop"]')).toHaveAttribute('data-hue', 'transport')
    for (const n of oneTouch?.querySelectorAll('button') ?? []) await expect(n).toHaveAttribute('data-hue', 'a')
    const feet = [...(stripGrid?.querySelectorAll('.foot button') ?? [])].slice(4)
    await expect(feet.length).toBe(5)
    for (const f of feet) await expect(f).toHaveAttribute('data-hue', 'lamp')
  },
}

/**
 * The golden layout at a smaller window, 1280 × 800 (`parameters.screen` sets --screen-width and
 * --screen-height), with `overlay` on: the same tree, every cut scaled with the screen.
 */
export const GoldenSmall: Story = {
  name: 'Golden › 1280 × 800',
  args: { layout: 'golden', overlay: true },
  parameters: { screen: { width: 1280, height: 800 } },
}

/**
 * The golden layout stopped, Sync Start armed: Start / Stop outlined, "▶ Stopped", Sync Start's ring
 * pulsing at the tempo (no beat comes while stopped), its pad twin armed in the same hue; the
 * section's line says "Sync Start armed".
 */
export const GoldenSyncStart: Story = {
  name: 'Golden › Sync Start armed',
  args: {
    ...stageStopped,
    layout: 'golden',
    overlay: false,
    sectionRow: { ...stageStopped.sectionRow, syncStart: true },
    display: { ...stageStopped.display, nowPlaying: { ...stageStopped.display.nowPlaying, syncStart: true } },
    pads: {
      ...stageStopped.pads,
      pads: stageStopped.pads.pads.map((pad) =>
        pad.label === 'Sync Start' ? { ...pad, state: 'armed' as const, name: 'Sync Start, armed' } : pad,
      ),
    },
  },
  play: async ({ canvasElement }) => {
    const transport = canvasElement.querySelector('[role="toolbar"][aria-label="Transport"]')
    const keys = [...(transport?.querySelectorAll('button') ?? [])]
    await expect(keys[0]).toHaveAttribute('data-face', 'off')
    // Start / Stop's name says what the band is doing.
    await expect(keys[0]).toHaveAccessibleName(/^Stopped: Start \/ Stop/)
    await expect(keys[1]).toHaveAttribute('data-face', 'armed')
    await expect(keys[1]).toHaveAttribute('data-pulse', 'free')
  },
}

/**
 * The golden layout fading out: Fade solid, 40% of its foot's drain bar run (`fadeProgress`), the board's
 * Fill Up queued for Main C (plain off, its queue in its name).
 */
export const GoldenFading: Story = {
  name: 'Golden › fading',
  args: {
    layout: 'golden',
    overlay: false,
    sectionRow: { ...stageBoard.sectionRow, fading: true, fadeProgress: 0.4 },
  },
  play: async ({ canvasElement }) => {
    const fade = canvasElement.querySelectorAll('[role="toolbar"][aria-label="Transport"] button')[5]
    await expect(fade).toHaveAttribute('data-face', 'on')
    await expect(fade).toHaveAttribute('data-drain', '0.60')
  },
}

/** All eight knobs assigned, with the longest names the app gives them (panels/stage/model.ts). */
const fullKnobs = [
  { label: 'Dynamics', code: 'DynCtrl', value: '127', fraction: 1 },
  { label: 'Retrig rate', code: 'RtgRate', value: '1/16', fraction: 0.6 },
  { label: 'Retrigger', code: 'RtgOnOff', value: 'Off', fraction: 0 },
  { label: 'Harm level', code: 'HarmVol', value: '100', fraction: 0.79 },
  { label: 'Click level', code: 'MetVol', value: '64', fraction: 0.5 },
  { label: 'Harm/Arp', code: 'HarmArp', value: 'On', fraction: 1 },
  { label: 'Mute B', code: 'StyMuteB', value: 'Off', fraction: 0 },
  { label: 'Tempo', code: 'Tempo', value: '288', fraction: 1 },
]

/** The worst case for the reading tier and the knobs: Ending III at 288 BPM, eight knobs assigned. */
const crowded = {
  layout: 'golden' as const,
  overlay: true,
  knobs: { ...stageBoard.knobs, knobs: fullKnobs },
  display: {
    ...stageBoard.display,
    nowPlaying: { ...stageBoard.display.nowPlaying, playing: 'Ending III', hue: 'ending' as const, next: '', fill: '', bpm: 288 },
  },
}

/** Checks the crowded board in real layout: nothing overflows, no two knob names or dials touch. */
async function crowdedPlay({ canvasElement, args }: { canvasElement: HTMLElement; args: { knobs?: { knobs: { label: string }[] } } }) {
  const overlay = canvasElement.querySelector('[data-golden="overlay"]')
  await waitFor(() => expect(overlay?.getAttribute('data-rows-off')).toBe('0'))
  const row = canvasElement.querySelector('[data-golden-name="knob row"] [data-golden-slots="grid"]')
  await expect(row?.getAttribute('data-weights')).toBe('unison unison unison unison unison unison unison unison')
  // Each name and value one line, its full name in the title (designer pass).
  const labels = (args.knobs?.knobs ?? []).map((k) => k.label)
  const nameLines = [...(row?.querySelectorAll<HTMLElement>('.text.name > span:first-child') ?? [])]
  await expect(nameLines.map((s) => s.textContent?.trim())).toEqual(labels)
  await expect(nameLines.map((s) => s.parentElement?.title)).toEqual(labels)
  const names = nameLines.map((s) => s.getBoundingClientRect())
  if (!names.length || names[0].width === 0) return
  await waitFor(() => expect(overlay?.getAttribute('data-overflow')).toBe('0'))
  // Every name and value within its cell less a fib-8, cut short with an ellipsis where it doesn't
  // fit, so two never touch.
  const cells = [...(row?.children ?? [])].map((c) => c.getBoundingClientRect())
  const values = [...(row?.querySelectorAll('.text.value > span') ?? [])].map((s) => s.getBoundingClientRect())
  for (const [i, c] of cells.entries()) {
    await expect(names[i].width).toBeLessThanOrEqual(c.width - 8 + 0.5)
    await expect(values[i].width).toBeLessThanOrEqual(c.width - 8 + 0.5)
  }
  for (let i = 1; i < names.length; i++) await expect(names[i].left - names[i - 1].right).toBeGreaterThanOrEqual(7.5)
  for (const s of nameLines) await expect(s.scrollHeight).toBeLessThanOrEqual(s.clientHeight + 1)
  // The dials the cell over phi (52 px at 1440), the slot pitch kept.
  const dials = [...(row?.querySelectorAll('.dial button') ?? [])].map((d) => d.getBoundingClientRect())
  for (const [i, d] of dials.entries()) await expect(d.width).toBeCloseTo(cells[i].width / 1.618, 0)
  // 288 and BPM inside the tempo's column, apart, on one baseline (288 measured to fit, as the
  // section's name); "Ending III" steps down within its own column.
  const tempo = canvasElement.querySelector('[data-hero] .tempo-col')!.getBoundingClientRect()
  await waitFor(() => {
    const numeral = canvasElement.querySelector('.tempo-col .bpm')!.getBoundingClientRect()
    const unit = canvasElement.querySelector('.tempo-col .unit')!.getBoundingClientRect()
    expect(unit.right).toBeLessThanOrEqual(tempo.right - 21 + 0.5)
    expect(unit.left - numeral.right).toBeGreaterThanOrEqual(7.5)
    expect(Math.abs(unit.bottom - numeral.bottom)).toBeLessThan(1)
  })
  // "Ending III" measured to the largest size that fits: its right edge on the column's inset.
  const column = canvasElement.querySelector('[data-hero] .section-col')!.getBoundingClientRect()
  await waitFor(() => {
    const name = canvasElement.querySelector('.section-col .stand > *')!.getBoundingClientRect()
    expect(name.right).toBeLessThanOrEqual(column.right - 21 + 0.5)
    expect(name.right).toBeGreaterThan(column.right - 21 - 3)
  })
}

/**
 * The golden layout with a long fingering ("AI Full Keyboard · played Gm7 over a long bass line")
 * and nothing queued: the chord's line stays one line, the fingering cut with an ellipsis (its full
 * text in the readout's spoken name, the fingering's tooltip on hover), never wrapping into the
 * beat bar; with nothing queued the section's line
 * says where the section is ("bar 3 of 4").
 */
export const GoldenLongFingering: Story = {
  name: 'Golden › long fingering',
  args: {
    layout: 'golden',
    overlay: false,
    display: {
      ...stageBoard.display,
      nowPlaying: {
        ...stageBoard.display.nowPlaying,
        next: '',
        fill: '',
        chord: { ...stageBoard.display.nowPlaying.chord, fingering: 'AI Full Keyboard · played Gm7 over a long bass line' },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const fingering = canvasElement.querySelector('.chord-col .readout .fingering') as HTMLElement
    await expect(fingering).not.toHaveAttribute('title')
    await expect(fingering).toHaveAttribute('data-tip', 'fingering.select')
    await expect(fingering.closest('.readout')?.getAttribute('aria-label')).toContain(
      'AI Full Keyboard · played Gm7 over a long bass line',
    )
    await expect(canvasElement.querySelector('[aria-label="Next section"]')?.textContent?.trim()).toBe('bar 3 of 4')
    const line = canvasElement.querySelector('.chord-col .readout .line')!.getBoundingClientRect()
    if (line.height === 0) return
    // One line: the fingering as tall as the notes, ending inside the column, over the beat bar.
    const tones = canvasElement.querySelector('.chord-col .readout .tones')!.getBoundingClientRect()
    const f = fingering.getBoundingClientRect()
    await expect(Math.abs(f.bottom - tones.bottom)).toBeLessThan(1)
    await expect(Math.abs(f.height - tones.height)).toBeLessThan(1)
    await expect(fingering.scrollWidth).toBeGreaterThan(fingering.clientWidth)
    const column = canvasElement.querySelector('[data-hero] .chord-col')!.getBoundingClientRect()
    await expect(f.right).toBeLessThanOrEqual(column.right - 21 + 0.5)
    await expect(line.bottom).toBeLessThan(canvasElement.querySelector('[data-hero] .beat .bar')!.getBoundingClientRect().top)
  },
}

/**
 * The golden layout crowded, at 1440 × 900: all eight knobs assigned with the app's longest names
 * (every cell one width, the dial the cell over phi, each name and value one line, cut short with
 * an ellipsis where it doesn't fit), Ending III playing at 288 BPM. The overlay must find nothing
 * overflowing and no two names touching.
 */
export const GoldenCrowded: Story = {
  name: 'Golden › crowded',
  args: crowded,
  play: crowdedPlay,
}

/** The crowded board at 1280 × 800. */
export const GoldenCrowdedSmall: Story = {
  name: 'Golden › crowded, 1280 × 800',
  args: crowded,
  parameters: { screen: { width: 1280, height: 800 } },
  play: crowdedPlay,
}

/** Eight knob names of about 14 characters: each cut short with an ellipsis, its full name in the title. */
const longKnobs = [
  'Retrigger rate',
  'Harmony volume',
  'Metronome vol.',
  'Arpeggio speed',
  'Style mute B+C',
  'Accomp. volume',
  'Filter cut-off',
  'Reverb send A1',
].map((label, i) => ({ ...fullKnobs[i], label }))

/** The crowded board with eight names of about 14 characters (the designer pass's test). */
export const GoldenCrowdedLong: Story = {
  name: 'Golden › crowded, 14-character names',
  args: { ...crowded, knobs: { ...stageBoard.knobs, knobs: longKnobs } },
  play: crowdedPlay,
}

/**
 * The golden layout, interactive: the Playground's wrapper (StagePlayground) in `layout="golden"`.
 * Transport, tempo, One Touch, the part rows, faders, knobs and pads respond as in the Playground;
 * while running, a story-only ticker moves the beat bar. `overlay` draws the cuts over it. The
 * transport's states: Start / Stop (▶ outlined, ■ solid), Sync Start (armed, pulsing; pad 4 the
 * same switch), Fill ▲ / ▼ while running (queues the next Main up or down: the Fill stays plain
 * off, the queue on the "then" line and in its name), Fade (running: solid, its wedge draining over four bars, then the band stops;
 * stopped: armed, a fade-in for Start).
 */
export const GoldenPlayground: Story = {
  args: { layout: 'golden', overlay: false },
  render: (args) => ({ Component: StagePlayground, props: args }),
}
