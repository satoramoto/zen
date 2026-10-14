// The sample mod's state (its PluginState keys): a repository's CI runs and what they cost.

/** A run's or a job's state, as the kit's status marks name them. */
export type RunStatus = 'running' | 'pending' | 'done' | 'failed'

/** One job of a run. */
export type Job = {
  name: string
  status: RunStatus
  /** A word on how it went: `3 failing`, `cached`. */
  note?: string
}

/** One workflow run on a branch. */
export type Run = {
  id: string
  workflow: string
  branch: string
  status: RunStatus
  /** How long it has run (or ran), in ms. */
  durationMs: number
  jobs: Job[]
}

/** The account's CI budget this month. */
export type Budget = {
  minutesUsed: number
  minutesMax: number
  /** The Actions cache, in MB. */
  cacheMb: number
  cacheMaxMb: number
  /** When the minutes reset, ms from now. */
  resetsInMs: number
}

/** Every key the mod keeps, as a fixture loads it. */
export type ChecksState = {
  repo: string
  runs: Run[] | null
  budget: Budget | null
  /** Section ids the person folded. */
  collapsed: string[]
}
