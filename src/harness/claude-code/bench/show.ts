// What a harness story draws with: the toolbar's surface and width, the kit for
// them, a render tree as the bench's DOM, and that DOM mounted in a React story.

import './globals'

import { createElement, useLayoutEffect, useRef } from 'react'
import type { ReactElement } from 'react'

import { kit } from '../kit/ui'
import { draw } from './render'
import type { Node, Surface } from './render'

/** What the helpers read of a story's context: the toolbar's globals and the story's id. */
export type StoryCtx = { globals: Record<string, any>; id: string }

/** The surface and width the toolbar picked. */
export const where = (ctx: StoryCtx) => ({
  surface: (ctx.globals.surface ?? 'desktop') as Surface,
  columns: Number(ctx.globals.columns ?? 46),
})

/** The kit for the toolbar's surface and width. */
export const kitFor = (ctx: StoryCtx) => {
  const { surface, columns } = where(ctx)
  // The app surfaces draw Svg (rounded ends); the terminal doesn't.
  const Svg = surface === 'terminal' ? undefined : ('Svg' as any)
  return kit({ Box: 'Box' as any, Text: 'Text' as any, Button: 'Button' as any, Svg }, surface, columns)
}

/** A render tree as DOM, for the toolbar's surface. Buttons redraw the story. */
export const show = (tree: unknown, ctx: StoryCtx, redraw?: () => void): HTMLElement => {
  const { surface } = where(ctx)
  const host = document.createElement('div')
  // The story is the drawing's site: its hover groups, hotkeys, typed text and Client instances are its own.
  const d = draw(
    tree as Node,
    surface,
    fn => {
      fn()
      redraw?.()
    },
    { client: { site: ctx.id } },
  )
  if (d) host.append(d)
  return host
}

/** Puts what `build` draws into the page, again on every render (a control or the toolbar changed). */
function Mount({ build }: { build: () => globalThis.Node | null }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const drawn = build()
    ref.current?.replaceChildren(...(drawn ? [drawn] : []))
  }, [build])
  return createElement('div', { ref })
}

/** A story's React element for the bench's DOM: `render: (args, ctx) => dom(() => show(tree, ctx))`. */
export const dom = (build: () => globalThis.Node | null): ReactElement => createElement(Mount, { build })
