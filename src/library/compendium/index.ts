/**
 * The compendium: the book primitives for an interactive textbook. React-only; not yet exported
 * from the package's public entries.
 */
export * from './model';
export { Formula, frac, recip, type FormulaProps } from './components/Formula/Formula';
export { Mark, MarkLegend, STANDING_LOOK, type MarkProps } from './components/Mark/Mark';
export { Peek, type PeekEntry, type PeekProps } from './components/Peek/Peek';
export { Sidenote, type SidenoteProps } from './components/Sidenote/Sidenote';
export { Figure, type FigureProps } from './components/Figure/Figure';
export { ProofGraph } from './components/ProofGraph/ProofGraph';
export { Timeline } from './components/Timeline/Timeline';
export { Scrub, Ref, type ScrubProps } from './components/Scrub/Scrub';
export { Steps, type StepsProps } from './components/Steps/Steps';
export { Exercise, type ExerciseProps } from './components/Exercise/Exercise';
export { Reading, P, H, Wide, type ReadingProps } from './layouts/Reading/Reading';
export { Document, type DocumentProps, type FigureRegistry } from './layouts/Document/Document';
export { Book, type BookProps } from './layouts/Book/Book';
