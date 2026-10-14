// The sample mod's scenes: what its atoms hold in each, by state key.
import type { ChecksState } from './types'

const MIN = 60_000

/** A working afternoon: one run going, one failed on a PR, the budget comfortable. */
export const busy: ChecksState = {
  repo: 'satoramoto/zen',
  collapsed: [],
  budget: { minutesUsed: 1_260, minutesMax: 3_000, cacheMb: 4_100, cacheMaxMb: 10_000, resetsInMs: 9 * 24 * 60 * MIN },
  runs: [
    {
      id: 'r1',
      workflow: 'checks',
      branch: 'main',
      status: 'running',
      durationMs: 4 * MIN + 12_000,
      jobs: [
        { name: 'typecheck', status: 'done', note: '38s' },
        { name: 'test', status: 'running' },
        { name: 'build:storybook', status: 'pending' },
      ],
    },
    {
      id: 'r2',
      workflow: 'checks',
      branch: 'harness-claude-code',
      status: 'failed',
      durationMs: 6 * MIN + 41_000,
      jobs: [
        { name: 'typecheck', status: 'done', note: '41s' },
        { name: 'test', status: 'failed', note: '3 failing' },
        { name: 'build:storybook', status: 'done', note: 'cached' },
      ],
    },
    { id: 'r3', workflow: 'release', branch: 'v0.4.0', status: 'done', durationMs: 2 * MIN + 5_000, jobs: [{ name: 'build:lib', status: 'done' }] },
  ],
}

/** Near the end of the month: minutes almost gone, the cache filling, two runs failing and one queued. */
export const nearLimit: ChecksState = {
  repo: 'satoramoto/zen',
  collapsed: [],
  budget: { minutesUsed: 2_790, minutesMax: 3_000, cacheMb: 8_100, cacheMaxMb: 10_000, resetsInMs: 26 * 60 * MIN },
  runs: [
    {
      id: 'r4',
      workflow: 'checks',
      branch: 'graph-merge-chips',
      status: 'failed',
      durationMs: 11 * MIN + 2_000,
      jobs: [
        { name: 'typecheck', status: 'failed', note: '2 errors' },
        { name: 'test', status: 'done' },
      ],
    },
    {
      id: 'r5',
      workflow: 'checks',
      branch: 'shader-materials-with-a-long-branch-name',
      status: 'failed',
      durationMs: 9 * MIN + 30_000,
      jobs: [{ name: 'build:storybook', status: 'failed', note: 'out of minutes' }],
    },
    { id: 'r6', workflow: 'checks', branch: 'main', status: 'pending', durationMs: 0, jobs: [] },
  ],
}

/** The first reads not in yet. */
export const loading: ChecksState = { repo: 'satoramoto/zen', collapsed: [], budget: null, runs: null }
