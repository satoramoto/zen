/** React-only linked projection, optics and binocular explorations. */
export {ProjectionExplorer,type ProjectionExplorerProps} from './components/ProjectionExplorer/ProjectionExplorer';
export {OpticsExplorer,type OpticsExplorerProps} from './components/OpticsExplorer/OpticsExplorer';
export {SpatialOptics,type SpatialOpticsProps} from './components/SpatialOptics/SpatialOptics';
export {StereoExplorer,type StereoExplorerProps} from './components/StereoExplorer/StereoExplorer';
/** Reusable clipped wire projection, finite ray-path and parallel stereo drawing primitives. */
export {ProjectionView,type ProjectionViewProps,type ProjectionLine,type ProjectionFace,type ProjectionDot,type ProjectionCamera,type ProjectionFacePick} from './components/ProjectionView/ProjectionView';
export {RayPathView,type RayPathViewProps} from './components/RayPathView/RayPathView';
export {StereoPair,type StereoPairProps} from './components/StereoPair/StereoPair';
/** Framework-free models, namespaced to keep coordinate conventions explicit. */
export * as PerspectiveGeometry from './model/projection';
export * as GeometricOptics from './model/optics';
export * as SpatialOpticsModel from './model/spatial';
export {stereoPoint,disparity,type StereoSettings} from './model/stereo';
