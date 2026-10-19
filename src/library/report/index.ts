// The research report (docs/research-report.md): a plain-JSON market research report (`model/`) and the
// document that renders it (`view/`). Its own area: it knows a market, a goal, findings and leads,
// never what the market is. Re-exported unchanged from the package root.

export {
  TIERS,
  CHANNELS,
  countBy,
  leadsByTier,
  leadsByChannel,
  isReady,
  readyLeads,
  filterLeads,
  formatReportDate,
  safeHref,
  type Tier,
  type Channel,
  type Report as ReportData,
  type Brief as ReportBrief,
  type Stat as ReportStat,
  type Segment as ReportSegment,
  type Finding as ReportFinding,
  type Lead,
  type Source as ReportSource,
  type LeadFilter,
} from './model/report';

/** The whole report as one document: masthead, brief, summary, segments, findings, leads, sources. */
export { Report, type ReportProps, type ReportMeasure } from './view/Report/Report';
/** Market and goal as prose, scope and method as lists. */
export { Brief, type BriefProps } from './view/Brief/Brief';
/** The headline numbers as stat tiles. */
export { Summary, type SummaryProps } from './view/Summary/Summary';
/** How the whole divides: a proportional bar and a legend, one hue slot per segment. */
export { Segments, type SegmentsProps } from './view/Segments/Segments';
/** Numbered headed paragraphs. */
export { Findings, type FindingsProps } from './view/Findings/Findings';
/** The leads grouped by tier, narrowed by a filter. */
export { LeadTable, type LeadTableProps } from './view/LeadTable/LeadTable';
/** A footnote list of sources. */
export { Sources, type SourcesProps } from './view/Sources/Sources';
