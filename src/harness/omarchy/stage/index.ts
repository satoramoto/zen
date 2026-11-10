// The Omarchy stage for stories: `OmarchyStage` draws a plugin as Qt draws it,
// and `stageOf(canvasElement)` hands a play its client. The server side is
// `./server.mjs` (`omarchyStage({ plugins })`, a Vite plugin).
export { OmarchyStage, stageOf } from './OmarchyStage';
export type { OmarchyStageProps } from './OmarchyStage';
export { StageClient, ROUTE, target } from './client';
export type { Target, Shown, ShownText, Call, LogEntry } from './client';
