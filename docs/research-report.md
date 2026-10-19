# Research report

`src/library/report/` is a **market research report**: one plain-JSON document about a market, a goal, what the research found and the leads it turned up, and the views that render it as a readable document. It is generic: nothing in it knows what the market is (festivals, clients, suppliers). Every word on the page except the section headings comes from the data.

- `model/report.ts`: the types below and pure helpers (`leadsByTier`, `leadsByChannel`, `readyLeads`, `isReady`, `filterLeads`, `countBy`, `formatReportDate`), unit-tested in `report.test.ts`. No React.
- `view/<Name>/`: `Report` (the whole document), and its parts `Brief`, `Summary`, `Segments`, `Findings`, `LeadTable`, `Sources`, each usable alone.
- `stories/`: the fixture and the stories under `Design OS/Report/…` (`Report`, `Lead Table`, `Parts`).

Everything is exported from `report/index.ts`, which the package root re-exports. The model's `Report` type is exported as `ReportData` (and `Brief`, `Stat`, `Segment`, `Finding`, `Source` as `ReportBrief`, `ReportStat`, …), since the view names are taken by the components.

## The JSON contract

```ts
type Tier = 'A' | 'B' | 'C';
type Channel = 'email' | 'form' | 'invite' | 'agency' | 'unknown';

interface Report {
  title: string;
  subtitle?: string | null;
  date: string;                  // ISO YYYY-MM-DD
  brief: Brief;
  summary: Stat[];               // headline numbers, in reading order
  segments?: Segment[] | null;   // how the leads divide, usually by tier
  findings: Finding[];
  leads: Lead[];
  sources?: Source[] | null;
}
interface Brief { market: string; goal: string; scope: string[]; method: string[] }
interface Stat { label: string; value: string | number; note?: string | null }
interface Segment { name: string; count: number; note: string }
interface Finding { heading: string; body: string }
interface Lead {
  name: string; tier: Tier; location: string; status: string; channel: Channel;
  when?: string | null;          // as found: a date range, a month, a season
  angle?: string | null;         // the one-line pitch
  skip?: string | null;          // why not to contact it
  contact?: string | null;       // an address or a name
  url?: string | null;           // its page; the lead's name links to it
  window?: string | null;        // when and how it takes submissions
  comparable?: string | null;
  fee?: string | null;
  travel?: string | null;
}
interface Source { label: string; url: string }
```

Optional fields may be absent or `null`: a serialiser that writes every column sends `null`, and both read as "not known". `status`, `fee` and the segment names are the app's own words; the views show them as written.

A lead is **ready** (`isReady`) when it is tier A, reached by email or form, and not marked `skip`.

## How it renders

- **Typography does the work.** Text roles only: the title is `display`, section heads `heading`, prose `body`, field names `label`, dates and footnotes `caption`, stats `numeral`. Colour is a tone or a hue slot: tier A, B, C (and segment 1, 2, 3) take hues 1–3.
- **Reading measure.** Prose holds `measure` (`narrow`, `normal`, `wide`: about 60, 70, 80 characters). The summary row and the lead table take the full width.
- **Lead table.** Grouped by tier, columns name, location, when, channel, angle (a skip reason in its place, quiet) and contact. Tier and channel are small outlined labels: a `Surface` (`radius="pill"`, `border`) holding a `Text`, not a new control. `filter` (`{ tier?, channel?, ready? }`) narrows it; with no rows an `empty` message stands in. Under 40rem of container width each row stacks into a block.

## Where the fixture came from

`stories/report.fixtures.ts` is a real report: a band's festival outreach research (90 leads across NJ, NY, PA, CT, MD and DE), copied from `ryangavin/funkadelic-booking`'s `report.json`, which that repo's `booking.py` writes from its `booking.db`. Null fields are left out.

## Feeding it from an app

The app writes the JSON however it likes (a script, a database export, an agent), then reads it and renders it:

```tsx
import { Report, ThemeScope, type ReportData } from '@satoramoto/zen';
import '@satoramoto/zen/zen.css';
import data from './report.json';

<ThemeScope ...>
  <Report report={data as ReportData} measure="normal" />
</ThemeScope>
```

A JSON import widens `tier` and `channel` to `string`, hence the cast; validate at the boundary if the file isn't yours. To show only the leads to contact now, pass `filter={{ ready: true }}`, or render `<LeadTable leads={data.leads} filter={{ ready: true }} />` on its own.
