/** Linked membrane/plate modes, illustrative cymatics and counter-propagating string waves. */
export {CymaticsExplorer,type CymaticsExplorerProps} from './CymaticsExplorer';
export {StandingString,type StandingStringProps} from './StandingString';
/** Reusable nodal-field canvas; controlled quantities stay in the caller. */
export {CymaticField,type CymaticFieldProps,type CymaticPaint} from './CymaticField';
/** Bounded analytic mode helpers, independent of React and Three. */
export {modeBasis,relativeFrequency,rmsAmplitude,displacement,mixWeights,type ModeShape,type ModeMix,type CymaticKind} from './modes';
