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
  safeContactHref,
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
/** The leads grouped by tier, narrowed by a filter; rows openable and selectable, columns chosen by the app. */
export { LeadTable, type LeadTableProps, type LeadColumn } from './view/LeadTable/LeadTable';
/** The leads as rows built for importance: an action, a date block, the lead, its details; openable, selectable, optionally grouped or compact. */
export { LeadList, type LeadListProps, type LeadAction, type LeadActionTone, type WhenBlock } from './view/LeadList/LeadList';
/** One opened lead: its header, the app's research fields as a definition list, sources and anything the app adds. */
export { LeadDetail, type LeadDetailProps, type DetailField } from './view/LeadDetail/LeadDetail';
/** One outgoing message written from proposals, in four stages driven by props: pick a proposal, edit the draft, read it back ready to send, sent. */
export { DraftFlow, type DraftFlowProps, type DraftProposal, type DraftWorking, type DraftFlowWords } from './view/DraftFlow/DraftFlow';
/** A footnote list of sources. */
export { Sources, type SourcesProps } from './view/Sources/Sources';
