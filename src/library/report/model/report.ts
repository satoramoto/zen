// The research report model (docs/research-report.md): one plain-JSON document about a market, a goal, what
// was found and the leads it turned up, plus pure helpers that read it. No React here, and nothing
// about any one market: the words come from the data.
//
// Optional fields may be absent or `null` (a serialiser that writes every column, as Python's
// `json.dumps` of a row does, sends `null`); both read as "not known".

/** How strong a lead is: A strongest. */
export type Tier = 'A' | 'B' | 'C';
/** How a lead is reached: a published address, a submission form, by invitation only, through an agency, or not yet known. */
export type Channel = 'email' | 'form' | 'invite' | 'agency' | 'unknown';

/** The tiers, strongest first. */
export const TIERS: readonly Tier[] = ['A', 'B', 'C'];
/** The channels, most direct first. */
export const CHANNELS: readonly Channel[] = ['email', 'form', 'invite', 'agency', 'unknown'];

export interface Report {
  title: string;
  subtitle?: string | null;
  /** ISO date (`YYYY-MM-DD`) the report was written. */
  date: string;
  brief: Brief;
  /** The headline numbers, in reading order. */
  summary: Stat[];
  /** How the leads divide (by tier, usually), with what each part means. */
  segments?: Segment[] | null;
  findings: Finding[];
  leads: Lead[];
  sources?: Source[] | null;
}

/** What was researched and why. */
export interface Brief {
  /** The market, in a sentence or two. */
  market: string;
  /** What the research is for. */
  goal: string;
  /** What was in and out. */
  scope: string[];
  /** How the leads were found and checked. */
  method: string[];
}

export interface Stat {
  label: string;
  value: string | number;
  note?: string | null;
}

export interface Segment {
  name: string;
  count: number;
  note: string;
}

export interface Finding {
  heading: string;
  body: string;
}

export interface Lead {
  name: string;
  tier: Tier;
  location: string;
  /** When it happens, as the research found it (a date range, a month, a season). */
  when?: string | null;
  /** Where the lead is in the work (`new`, `researched`, …): the app's word. */
  status: string;
  channel: Channel;
  /** The one-line pitch: why this lead fits. */
  angle?: string | null;
  /** Why not to contact it, when that is the conclusion. */
  skip?: string | null;
  /** Who to write to: an address or a name. */
  contact?: string | null;
  /** The lead's page (its booking or contact page when known). */
  url?: string | null;
  /** When and how it takes submissions. */
  window?: string | null;
  /** Comparable names it has worked with. */
  comparable?: string | null;
  /** A rough size of the opportunity (`small`, `mid`, `large`): the app's word. */
  fee?: string | null;
  /** Distance or travel from home base. */
  travel?: string | null;
}

export interface Source {
  label: string;
  url: string;
}

/** What a lead list is narrowed to. Every given field must hold; `ready: true` keeps only `isReady` leads. */
export interface LeadFilter {
  tier?: Tier;
  channel?: Channel;
  ready?: boolean;
}

/** How many of `items` fall under each key, in first-seen order. Keys no item has are absent. */
export function countBy<T, K extends PropertyKey>(items: readonly T[], key: (item: T) => K): Partial<Record<K, number>> {
  const out: Partial<Record<K, number>> = {};
  for (const item of items) {
    const k = key(item);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

/** Each item under its key, in input order, with every key in `keys` present (empty when none). */
function groupBy<T, K extends PropertyKey>(items: readonly T[], keys: readonly K[], key: (item: T) => K): Record<K, T[]> {
  const out = Object.fromEntries(keys.map((k) => [k, [] as T[]])) as Record<K, T[]>;
  for (const item of items) (out[key(item)] ??= []).push(item);
  return out;
}

/** The leads under each tier (A, B, C, all present), in report order. */
export function leadsByTier(report: Pick<Report, 'leads'>): Record<Tier, Lead[]> {
  return groupBy(report.leads, TIERS, (l) => l.tier);
}

/** The leads under each channel (all five present), in report order. */
export function leadsByChannel(report: Pick<Report, 'leads'>): Record<Channel, Lead[]> {
  return groupBy(report.leads, CHANNELS, (l) => l.channel);
}

/** A lead that can be contacted now: tier A, reached by email or form, and not marked skip. */
export function isReady(lead: Lead): boolean {
  return lead.tier === 'A' && (lead.channel === 'email' || lead.channel === 'form') && !lead.skip;
}

/** The leads that can be contacted now (`isReady`), in report order. */
export function readyLeads(report: Pick<Report, 'leads'>): Lead[] {
  return report.leads.filter(isReady);
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** A report date for reading: `2026-10-19` → `19 October 2026`, as a calendar date (no time zone). Anything else is returned as written. */
export function formatReportDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  const month = m ? MONTHS[Number(m[2]) - 1] : undefined;
  return m && month && Number(m[3]) >= 1 && Number(m[3]) <= 31 ? `${Number(m[3])} ${month} ${m[1]}` : iso;
}

/** The leads that pass `filter`, in input order. An empty filter keeps them all. */
export function filterLeads(leads: readonly Lead[], filter: LeadFilter = {}): Lead[] {
  return leads.filter(
    (l) =>
      (filter.tier === undefined || l.tier === filter.tier) &&
      (filter.channel === undefined || l.channel === filter.channel) &&
      (!filter.ready || isReady(l)),
  );
}
