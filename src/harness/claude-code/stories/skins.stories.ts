// Every zen theme pack's skin (kit/skins.ts) on one representative kit section, side by side, so
// the mapping from a pack's palette to the kit's meanings can be checked: the status marks, a
// reading at each level (quantity, near a limit, over it), both chart ramps, and the first three
// accents on the sections' bands.
import type { Meta, ReactRenderer } from '@storybook/react-vite'
import type { StoryAnnotations } from 'storybook/internal/types'

import type { Skin } from '../kit/skin'
import { SKINS } from '../kit/skins'
import type { SkinId } from '../kit/skins'
import { ACCENT, C, GLYPH, GRAY, MUTED, RAMP, SKIN, STATUS, levelColor, wear } from '../kit/tokens'
import type { StatusKind } from '../kit/tokens'
import { kit } from '../kit/ui'
import { CELL, draw, h as node } from '../bench/render'
import type { Child, Node } from '../bench/render'
import { dom } from '../bench/show'

type Args = Record<string, any>

const h = (type: string, props: Record<string, any> | null, ...children: unknown[]): Node => node(type, props, ...(children as Child[]))

const meta: Meta<Args> = { title: 'Harness/Claude Code/Skins', parameters: { layout: 'fullscreen' } }
export default meta

/** The skin worn now, whole, so the story can put it back after wearing each pack's. */
const worn = (): Skin => ({
  label: 'worn',
  ok: C.ok,
  warn: C.warn,
  bad: C.bad,
  blue: C.blue,
  purple: C.purple,
  cyan: C.cyan,
  slate: C.slate,
  orchid: C.orchid,
  ramp: { blue: [...RAMP.blue], slate: [...RAMP.slate] },
  muted: MUTED,
  gray: { ...GRAY },
  hues: ACCENT.slice(0, 5) as unknown as Skin['hues'],
  roles: ACCENT.slice(5, 7) as unknown as Skin['roles'],
})

const COLUMNS = 40

/** The section each skin draws: statuses, a reading per level, the slate and blue ramps. */
const sample = () => {
  const k = kit({ Box: 'Box' as any, Text: 'Text' as any, Button: 'Button' as any, Svg: 'Svg' as any }, 'desktop', COLUMNS)
  return h(
    'Box',
    { flexDirection: 'column' },
    k.section({
      id: 'skin',
      icon: GLYPH.limits,
      title: 'Readings',
      accent: ACCENT[0],
      right: k.summary([['3', 'levels'], ['1', 'over', C.bad]]),
      children: [
        k.reading('q', { label: 'Quantity', value: 42, max: 100, color: levelColor(42), figure: '42%', unit: 'ok' }),
        k.reading('n', { label: 'Near', value: 81, max: 100, color: levelColor(81), figure: '81%', unit: '3d4h' }),
        k.reading('o', { label: 'Over', value: 93, max: 100, color: levelColor(93), figure: '93%', unit: 'full', unitColor: C.bad }),
      ],
    }),
    k.section({
      id: 'status',
      icon: GLYPH.agents,
      title: 'Statuses',
      accent: ACCENT[1],
      children: [h('Box', { flexDirection: 'row', flexWrap: 'wrap', columnGap: k.space.item }, ...(Object.keys(STATUS) as StatusKind[]).map(s => k.status(s, s, s))) as any],
    }),
    k.section({
      id: 'ramps',
      icon: GLYPH.context,
      title: 'Ramps',
      accent: ACCENT[2],
      children: [
        k.bar(RAMP.slate.map(color => ({ value: 10, color })), 40),
        k.bar(RAMP.blue.map(color => ({ value: 10, color })), 40),
        k.bar([{ value: 12, color: C.cyan }, { value: 12, color: C.orchid }, { value: 12, color: C.purple }], 36),
      ],
    }),
  )
}

/**
 * Each pack's skin on the desktop, in the toolbar's pane theme (an ANSI theme in its light or dark
 * look); `skin` picks one or `all`. The terminal draws no skin: it draws each meaning in its own
 * theme key, so this story draws the desktop whatever the toolbar's surface.
 */
export const EveryPack: StoryAnnotations<ReactRenderer, Args> = {
  globals: { paneFrame: 'pane', columns: '180' },
  args: { skin: 'all' },
  argTypes: { skin: { control: 'select', options: ['all', ...Object.keys(SKINS)] } },
  render: (args, ctx) =>
    dom(() => {
      const look = String(ctx.globals.paneTheme ?? 'dark').replace(/-ansi$/, '')
      const ids = (args.skin === 'all' ? Object.keys(SKINS) : [args.skin]) as SkinId[]
      const host = document.createElement('div')
      host.style.cssText = 'display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start;font:12px/1.4 -apple-system,system-ui,sans-serif;color:#8e8e93'
      const was = SKIN === 'custom' ? worn() : SKIN
      for (const id of ids) {
        wear(id)
        const cell = document.createElement('div')
        cell.append(Object.assign(document.createElement('div'), { textContent: `${SKINS[id].label} · ${id}`, style: 'margin-bottom:4px' }))
        const pane = document.createElement('div')
        pane.className = `pane ${look}`
        const body = document.createElement('div')
        body.className = 'body'
        body.style.width = `${COLUMNS * CELL.col}px`
        const drawn = draw(sample(), 'desktop', fn => fn(), { client: { site: `${ctx.id}-${id}` } })
        if (drawn) body.append(drawn)
        pane.append(body)
        cell.append(pane)
        host.append(cell)
      }
      wear(was)
      // The story draws its own panes: the toolbar's frame around it steps aside.
      setTimeout(() => {
        const frame = host.closest('.pane') as HTMLElement | null
        const body = host.closest('.body') as HTMLElement | null
        if (frame) {
          frame.className = 'pane'
          frame.style.cssText = 'background:none;padding:0;display:block'
        }
        if (body) body.style.width = 'auto'
      })
      return host
    }),
}
