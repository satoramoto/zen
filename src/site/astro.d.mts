import type { AstroUserConfig } from 'astro';
import type { SourceIdentity } from 'story-spec/walkthrough';

export interface SiteOptions {
  title: string;
  description?: string;
  /** Absolute public origin, e.g. https://satoramoto.github.io. */
  site?: string;
  /** Project prefix, e.g. /pichii/. Defaults to /. */
  base?: string;
  /** Zen pack ID; defaults to textbook-console. */
  theme?: string;
  mode?: 'light' | 'dark';
  revision?: string;
  source?: string;
  /** Paths are relative to the Astro project root. Markdown remains trusted source. */
  content: Array<{ file: string; slug?: string; title?: string } | { directory: string; prefix?: string }>;
  /** Generated beforehand by the consumer; copied verbatim into the static output. */
  generated?: Array<{ from: string; to: string; title: string; entry?: string }>;
  /** Completed producer output plus independently computed expected source identities. */
  manuals?: Array<{ from: string; prefix?: string; sources: Record<string, SourceIdentity> }>;
}
export function defineSite(options: SiteOptions): AstroUserConfig;
