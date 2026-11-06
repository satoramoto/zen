/** React-only solid slicing and linked complex-function explorations. */
export {SolidSections,type SolidSectionsProps} from './SolidSections';
export {ComplexExplorer,type ComplexExplorerProps} from './ComplexExplorer';
/** Renderer-independent sampled geometry and plane-intersection primitives. */
export {sampleSurface,intersectMesh,planeFrame,type TriangleMesh,type CuttingPlane,type PlaneSection,type Vec3,type Vec2} from './geometry';
/** Bounded educational complex evaluator; zeta excludes its pole and unsupported inputs. */
export {evaluateComplex,zeta,type Complex,type ComplexFunction} from './complex';
/** Complex summation and linked discrete/continuous counting demonstrations. */
export {ComplexSeries,PrimeCounting} from './ZetaFoundations';
