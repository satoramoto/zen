import type { Plugin } from 'vite';
import type { Session } from './session.mjs';

export const ROUTE: string;
/** Sessions that may be starting at once unless `maxStarting` says otherwise. */
export const MAX_STARTING: number;
/** Runs at most `max` of the tasks given to it at once; the rest wait their turn, in order. */
export function limiter(max: number): <T>(task: () => Promise<T>) => Promise<T>;

/** One plugin the stage can run. */
export interface PluginEntry {
  /** The plugin's folder, holding its manifest.json. */
  source: string | (() => string);
  /** Entry points to load (barWidget, service, menu, panel, …); every one in the manifest by default. */
  roles?: string[];
  /** The bar section a widget sits in. */
  section?: 'left' | 'center' | 'right';
  /** The widget's inline settings. */
  settings?: Record<string, unknown>;
  /** Edits the staged copy, as an install would (fill placeholders, vendor files). */
  prepare?: (dir: string, session: Session) => void;
  /** A module whose default export builds the session's fixture. */
  fixture?: string;
  /** What the viewer is told when the plugin isn't on this machine. */
  missing?: string;
}

/** The stage's Vite plugin: runs one headless Quickshell per open story under /__omarchy-stage/. */
export function omarchyStage(options: { plugins: Record<string, PluginEntry> | (() => Record<string, PluginEntry> | Promise<Record<string, PluginEntry>>); root?: string; /** Sessions that may be starting at once, whoever asks (4). */ maxStarting?: number }): Plugin;
export default omarchyStage;
