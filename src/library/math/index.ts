/** Framework-bound mathematical presentation; evaluation remains the caller's responsibility. */
export * from './view/ExactValue';
export * from './view/ExpressionField';
export * from './view/PlotViewport/PlotViewport';
export { projectPoints } from './view/PlotViewport/PlotViewport.model';
export * from './view/MathInspector';
export * from './view/DistributionPlot';
// Linked exploration scenes are React-only; existing Svelte math primitives remain intact.
export * from './explore';
export * from './signals';
export * from './lab';
