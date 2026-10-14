// A sample mod, written the way awesome-claude's mods are: a `checks` pane showing a repository's
// CI runs (each with its jobs as a tree) and the month's CI budget, drawn with the kit on every
// surface. Its state lives in atoms; a fold or a Retry writes them, and the pane draws again.
// Storybook draws it through the bench (Harness/Claude Code/Sample mod), from fixtures.ts.
import { atom, read, update } from 'claude-code'
import type { RenderElement, Register } from 'claude-code'

import { duration, pct, short } from '../kit/format'
import { C, GLYPH, levelColor } from '../kit/tokens'
import { holdButtons, kit } from '../kit/ui'
import type { Els } from '../kit/ui'
import type { Budget, Run, RunStatus } from './types'

export const PLUGIN = 'checks'
const PANE = 'checks'

const repo = atom({ plugin: PLUGIN, key: 'repo' }, '')
const runs = atom({ plugin: PLUGIN, key: 'runs' }, null as Run[] | null)
const budget = atom({ plugin: PLUGIN, key: 'budget' }, null as Budget | null)
const collapsed = atom({ plugin: PLUGIN, key: 'collapsed' }, [] as string[])

const count = (list: Run[], status: RunStatus) => list.filter(r => r.status === status).length

export const register: Register = on => {
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const data = { repo: await read($, repo), runs: await read($, runs), budget: await read($, budget), folded: await read($, collapsed) }
    const els = holdButtons($.ui.resolve(e), e) as unknown as Els
    const { Box } = els
    const k = kit(els, e.surface, e.props.bodyColumns, { focused: e.props.isFocused })

    const toggle = (id: string) => () => void update($, collapsed, c => (c.includes(id) ? c.filter(x => x !== id) : [...c, id]))
    /** Starts a failed run's failed jobs again. */
    const retry = (id: string) => () =>
      void update($, runs, list =>
        (list ?? []).map(r =>
          r.id === id ? { ...r, status: 'running' as const, durationMs: 0, jobs: r.jobs.map(j => (j.status === 'failed' ? { name: j.name, status: 'running' as const } : j)) } : r,
        ),
      )

    const list = data.runs
    const head = k.item('head', {
      text: data.repo,
      dim: true,
      right: list
        ? [
            k.summary([
              count(list, 'running') ? ['' + count(list, 'running'), 'running', C.blue] : null,
              count(list, 'failed') ? ['' + count(list, 'failed'), 'failed', C.bad] : null,
              count(list, 'pending') ? ['' + count(list, 'pending'), 'queued'] : null,
            ]),
          ]
        : [],
    })

    const b = data.budget
    const minutes = b ? (b.minutesUsed / b.minutesMax) * 100 : 0
    const cache = b ? (b.cacheMb / b.cacheMaxMb) * 100 : 0
    const budgetSection = k.section({
      id: 'budget',
      icon: GLYPH.limits,
      title: 'Budget',
      right: b ? k.summary([[pct(b.minutesUsed, b.minutesMax), 'minutes', minutes >= 75 ? levelColor(minutes) : undefined]]) : null,
      loading: !b,
      restated: true,
      collapsed: data.folded.includes('budget'),
      onToggle: toggle('budget'),
      children: b
        ? [
            k.reading('min', { label: 'Minutes', value: b.minutesUsed, max: b.minutesMax, color: levelColor(minutes), figure: pct(b.minutesUsed, b.minutesMax), unit: short(b.resetsInMs) }),
            k.reading('cache', { label: 'Cache', value: b.cacheMb, max: b.cacheMaxMb, color: levelColor(cache), figure: pct(b.cacheMb, b.cacheMaxMb), unit: `${(b.cacheMb / 1000).toFixed(1)}G` }),
          ]
        : [k.note('reading-budget', 'Reading the billing…', 'loading')],
    })

    const rows: (RenderElement | null)[] = []
    for (const r of list ?? []) {
      rows.push(
        k.item(r.id, {
          lead: r.status,
          text: r.workflow,
          note: r.branch,
          right: [
            r.status === 'pending' ? 'queued' : duration(r.durationMs),
            r.status === 'failed' ? k.actions(`${r.id}-acts`, [{ key: 'retry', label: 'Retry', onPress: retry(r.id) }]) : null,
          ],
        }),
      )
      r.jobs.forEach((j, i) =>
        rows.push(k.item(`${r.id}-${j.name}`, { tree: k.tree([], i === r.jobs.length - 1), lead: j.status, text: j.name, dim: j.status === 'pending', right: j.note ? [j.note] : [] })),
      )
    }
    const runsSection = k.section({
      id: 'runs',
      icon: GLYPH.branch,
      title: 'Runs',
      right: list ? k.summary([['' + list.length, 'runs']]) : null,
      loading: !list,
      collapsed: data.folded.includes('runs'),
      onToggle: toggle('runs'),
      children: !list ? [k.note('reading-runs', 'Reading workflow runs…', 'loading')] : list.length ? rows : [k.note('none', 'No runs yet.')],
    })

    return (
      <Box flexDirection="column">
        {head}
        {budgetSection}
        {runsSection}
      </Box>
    )
  })
}
