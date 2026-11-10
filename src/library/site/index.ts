/** Static-site reading components; Astro build machinery is in @satoramoto/zen/astro. */
export { Documentation, Search } from './components/Documentation/Documentation';
export type { DocumentationProps, SitePage, SiteLink } from './components/Documentation/Documentation';
export { Walkthrough } from './components/Walkthrough/Walkthrough';
export type { WalkthroughProps } from './components/Walkthrough/Walkthrough';
/** Read-only documentation diagrams built on Zen's graph canvas. */
export { Flowchart, type FlowchartData } from './components/Flowchart/Flowchart';
