import type { Plugin } from 'vite';
import type { Session } from './session.mjs';

export const ROUTE: string;

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
export function omarchyStage(options: { plugins: Record<string, PluginEntry>; root?: string }): Plugin;
export default omarchyStage;
