/** Linked membrane/plate modes, illustrative cymatics and counter-propagating string waves. */
export {CymaticsExplorer,type CymaticsExplorerProps} from './components/CymaticsExplorer/CymaticsExplorer';
export {StandingString,type StandingStringProps} from './components/StandingString/StandingString';
/** Reusable nodal-field canvas; controlled quantities stay in the caller. */
export {CymaticField,type CymaticFieldProps,type CymaticPaint} from './components/CymaticField/CymaticField';
/** Bounded analytic mode helpers, independent of React and Three. */
export {modeBasis,relativeFrequency,rmsAmplitude,displacement,mixWeights,type ModeShape,type ModeMix,type CymaticKind} from './modes';
