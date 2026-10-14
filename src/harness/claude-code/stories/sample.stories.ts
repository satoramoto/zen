// The sample mod's pane (sample/), from its own render hook through the bench's host, one story
// per scene; the toolbar picks the surface, pane theme, frame, width and skin. As awesome-claude's
// stories/overview.stories.ts draws its overview mod.
import type { Meta, StoryObj } from '@storybook/react-vite'

import { load, onChange } from '../bench/engine'
import { collect, panes } from '../bench/host'
import { draw } from '../bench/render'
import type { Node } from '../bench/render'
import { dom, show, where } from '../bench/show'
import * as scenes from '../sample/fixtures'
import * as mod from '../sample/register'

const hooks = collect(mod as any)

const meta: Meta = { title: 'Harness/Claude Code/Sample mod', parameters: { layout: 'fullscreen', paneTitle: 'Checks' } }
export default meta

/** A scene's pane, drawn again on every state change, so a fold or a Retry works. */
const scenario = (name: keyof typeof scenes): StoryObj => ({
  render: (_, ctx) =>
    dom(() => {
      const host = document.createElement('div')
      let first = true
      const paint = async () => {
        if (!first && !host.isConnected) return
        first = false
        const { surface, columns } = where(ctx)
        const trees = await panes(hooks, surface, columns)
        host.replaceChildren(...trees.map(t => show(t, ctx)))
      }
      load(mod.PLUGIN, scenes[name] as unknown as Record<string, unknown>)
      onChange(() => void paint())
      void paint()
      return host
    }),
})

export const Busy = scenario('busy')
export const NearLimit = scenario('nearLimit')
export const Loading = scenario('loading')

/** The widths the terminal sheet draws the pane at, in cells: 26 is under the kit's floor (headers and figures only). */
const WIDTHS = [26, 30, 40, 60, 100]

/** A scene on the terminal at 26 to 100 columns side by side, whatever the toolbar says: nothing may overflow or wrap at any of them. */
const terminalSheet = (name: keyof typeof scenes): StoryObj => ({
  globals: { paneFrame: 'pane', surface: 'terminal', columns: '110' },
  render: (_, ctx) =>
    dom(() => {
      const host = document.createElement('div')
      host.style.cssText = 'display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start;font:12px/1.4 -apple-system,system-ui,sans-serif;color:#8e8e93'
      let first = true
      const paint = async () => {
        if (!first && !host.isConnected) return
        first = false
        const cells = await Promise.all(
          WIDTHS.map(async w => {
            const cell = document.createElement('div')
            const label = Object.assign(document.createElement('div'), { textContent: `terminal · ${w} columns` })
            label.style.marginBottom = '4px'
            const pane = document.createElement('div')
            pane.className = 'pane terminal'
            const body = document.createElement('div')
            body.className = 'body'
            body.style.width = `${w}ch`
            body.style.overflow = 'hidden'
            for (const tree of await panes(hooks, 'terminal', w)) {
              const drawn = draw(tree as Node, 'terminal', fn => fn(), { client: { site: `${ctx.id}-${w}` } })
              if (drawn) body.append(drawn)
            }
            pane.append(body)
            cell.append(label, pane)
            return cell
          }),
        )
        host.replaceChildren(...cells)
      }
      load(mod.PLUGIN, scenes[name] as unknown as Record<string, unknown>)
      onChange(() => void paint())
      void paint()
      // The sheet draws its own panes: the toolbar's frame around it steps aside.
      setTimeout(() => {
        const frame = host.closest('.pane') as HTMLElement | null
        const body = host.closest('.body') as HTMLElement | null
        if (frame) frame.style.cssText = 'background:none;padding:0;display:block'
        if (body) body.style.width = 'auto'
      })
      return host
    }),
})

export const BusyTerminalWidths = terminalSheet('busy')
export const NearLimitTerminalWidths = terminalSheet('nearLimit')
