/** React-only linked projection, optics and binocular explorations. */
export {ProjectionExplorer,type ProjectionExplorerProps} from './ProjectionExplorer';
export {OpticsExplorer,type OpticsExplorerProps} from './OpticsExplorer';
export {SpatialOptics,type SpatialOpticsProps} from './SpatialOptics';
export {StereoExplorer,type StereoExplorerProps} from './StereoExplorer';
/** Reusable clipped wire projection, finite ray-path and parallel stereo drawing primitives. */
export {ProjectionView,type ProjectionViewProps,type ProjectionLine,type ProjectionFace} from './ProjectionView';
export {RayPathView,type RayPathViewProps} from './RayPathView';
export {StereoPair,type StereoPairProps} from './StereoPair';
/** Framework-free models, namespaced to keep coordinate conventions explicit. */
export * as PerspectiveGeometry from './model/projection';
export * as GeometricOptics from './model/optics';
export * as SpatialOpticsModel from './model/spatial';
export {stereoPoint,disparity,type StereoSettings} from './model/stereo';
