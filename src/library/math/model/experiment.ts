import { validateDomain, validatePlacement, validatePredicate, type IntegerDomain, type Placement, type Predicate } from './integer';

export interface MathLayer {
  id: string; label: string; predicate: Predicate; visible: boolean;
  hue: 1 | 2 | 3 | 4; opacity: number; channel: 'fill' | 'outline';
}
export interface StudioCamera { yaw: number; pitch: number; zoom: number; panX: number; panY: number }
export interface StudioViewSettings { labels: boolean; sizeByDivisors: boolean; onlyMatches: boolean; renderMode?: 'auto'|'points'|'density' }
export interface StudioExperiment {
  schemaVersion: 1;
  domain: IntegerDomain;
  placement: Placement;
  layers: MathLayer[];
  selectedId: string | null;
  camera: StudioCamera;
  relations: 'none' | 'divisors' | 'multiples';
  slice: number | null;
  /** Omitted in earlier version-1 documents; consumers use false for all three settings. */
  view?: StudioViewSettings;
}
export interface ExperimentSnapshot { id: string; name: string; experiment: StudioExperiment }
export interface ExperimentDocument {
  format: 'zen-spatial-studio'; version: 1; experiment: StudioExperiment; snapshots: ExperimentSnapshot[];
}
export function defaultExperiment(): StudioExperiment {
  const a: Predicate = { kind: 'multiple', divisor: 3 };
  const b: Predicate = { kind: 'square' };
  return { schemaVersion: 1, domain: { start: 1, end: 400, step: 1 }, placement: { kind: 'grid', width: 20, depth: 10 },
    layers: [
      { id: 'multiples', label: 'Multiples of 3', predicate: a, visible: true, hue: 1, opacity: 1, channel: 'fill' },
      { id: 'squares', label: 'Square numbers', predicate: b, visible: true, hue: 2, opacity: 1, channel: 'outline' },
      { id: 'intersection', label: 'Intersection', predicate: { kind: 'and', left: a, right: b }, visible: true, hue: 3, opacity: 1, channel: 'fill' },
    ], selectedId: '36', camera: { yaw: 35, pitch: 30, zoom: 1, panX: 0, panY: 0 }, relations: 'none', slice: null, view: { labels: false, sizeByDivisors: false, onlyMatches: false } };
}
function record(x: unknown): x is Record<string, unknown> { return typeof x === 'object' && x !== null && !Array.isArray(x); }
function finite(x: unknown, min: number, max: number): x is number { return typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max; }
function boundedText(x: unknown, max: number): x is string { return typeof x === 'string' && x.length > 0 && x.length <= max; }
/** Validates the whole document before the application replaces any current state. */
export function validateExperiment(value: unknown): string | null {
  if (!record(value) || value.schemaVersion !== 1) return 'Unsupported experiment version.';
  if (!record(value.domain)) return 'Missing integer domain.';
  const domain = value.domain as unknown as IntegerDomain;
  const domainError = validateDomain(domain); if (domainError) return domainError;
  if (!record(value.placement)) return 'Missing placement.';
  const placement = value.placement as unknown as Placement;
  const placementError = validatePlacement(placement); if (placementError) return placementError;
  if (!Array.isArray(value.layers) || value.layers.length > 32) return 'Use at most 32 layers.';
  const ids = new Set<string>();
  for (const layer of value.layers) {
    if (!record(layer) || !boundedText(layer.id, 80) || ids.has(layer.id) || !boundedText(layer.label, 160) || !validatePredicate(layer.predicate) || typeof layer.visible !== 'boolean' || ![1, 2, 3, 4].includes(Number(layer.hue)) || typeof layer.hue !== 'number' || !finite(layer.opacity, 0, 1) || !['fill', 'outline'].includes(String(layer.channel))) return 'Invalid layer definition or duplicate layer ID.';
    ids.add(layer.id);
  }
  if (value.selectedId !== null) {
    if (typeof value.selectedId !== 'string' || !/^[1-9]\d*$/.test(value.selectedId)) return 'Invalid selected integer.';
    const n = Number(value.selectedId);
    if (!Number.isSafeInteger(n) || n < domain.start || n > domain.end || (n - domain.start) % domain.step !== 0) return 'Selected integer is outside the domain.';
  }
  if (value.view !== undefined && (!record(value.view) || typeof value.view.labels !== 'boolean' || typeof value.view.sizeByDivisors !== 'boolean' || typeof value.view.onlyMatches !== 'boolean' || (value.view.renderMode !== undefined && !['auto','points','density'].includes(String(value.view.renderMode))))) return 'Invalid view settings.';
  const c = value.camera;
  if (!record(c) || !finite(c.yaw, -360, 360) || !finite(c.pitch, -89, 89) || !finite(c.zoom, 0.1, 64) || !finite(c.panX, -10000, 10000) || !finite(c.panY, -10000, 10000)) return 'Invalid camera state.';
  if (!['none', 'divisors', 'multiples'].includes(String(value.relations))) return 'Invalid relation mode.';
  if (value.slice !== null && (typeof value.slice !== 'number' || !Number.isSafeInteger(value.slice) || value.slice < 0 || value.slice >= Math.ceil((Math.floor((domain.end - domain.start) / domain.step) + 1) / (placement.width * placement.depth)))) return 'Invalid depth slice.';
  return null;
}
/** Copy plain experiment data: snapshots must not track subsequent mutable edits. */
export function cloneExperiment(experiment: StudioExperiment): StudioExperiment { return JSON.parse(JSON.stringify(experiment)) as StudioExperiment; }
export function captureExperiment(experiment: StudioExperiment, id: string, name: string): ExperimentSnapshot {
  const error = validateExperiment(experiment); if (error) throw new Error(error);
  if (!boundedText(id, 80) || !boundedText(name, 160)) throw new Error('Snapshot needs an ID and a name.');
  return { id, name, experiment: cloneExperiment(experiment) };
}
export function serializeExperiment(experiment: StudioExperiment, snapshots: ExperimentSnapshot[] = []): string {
  const document: ExperimentDocument = { format: 'zen-spatial-studio', version: 1, experiment, snapshots };
  const json = JSON.stringify(document, null, 2);
  parseExperiment(json);
  return json;
}
export function parseExperiment(json: string): ExperimentDocument {
  if (json.length > 1_000_000) throw new Error('Experiment file is too large.');
  let value: unknown;
  try { value = JSON.parse(json); } catch { throw new Error('Experiment file is not valid JSON.'); }
  if (!record(value) || value.format !== 'zen-spatial-studio' || value.version !== 1) throw new Error('Unsupported experiment file.');
  const error = validateExperiment(value.experiment); if (error) throw new Error(error);
  if (!Array.isArray(value.snapshots) || value.snapshots.length > 32) throw new Error('Use at most 32 snapshots.');
  const ids = new Set<string>();
  for (const snapshot of value.snapshots) {
    if (!record(snapshot) || !boundedText(snapshot.id, 80) || ids.has(snapshot.id) || !boundedText(snapshot.name, 160)) throw new Error('Invalid snapshot.');
    const problem = validateExperiment(snapshot.experiment); if (problem) throw new Error(`Invalid snapshot: ${problem}`);
    ids.add(snapshot.id);
  }
  return value as unknown as ExperimentDocument;
}
