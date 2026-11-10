/** Measured, glasses-free stereo illusions and reusable physical stereo rendering. */
export {StereoIllusionLab,type StereoIllusionLabProps} from './components/StereoIllusionLab/StereoIllusionLab';
export {DotStereoView,type DotStereoViewProps} from './components/DotStereoView/DotStereoView';
export {DisplayCalibration,useDisplayInvalidation,type DisplayCalibrationProps} from './components/DisplayCalibration/DisplayCalibration';
export {fitStereoLayout,depthRange,vergenceDistance,vergenceAngle,reliefParallax,eyeImageShift,type StereoViewer,type StereoLayout,type FusionMode} from './viewer';
export {illusionHeight,stereoIllusions,type StereoIllusion} from './illusions';

/** Optional clear-target fusion guide and single-view motion alternative. */
export {FusionTargets,type FusionTargetsProps} from './components/FusionTargets/FusionTargets';
export {MotionRelief} from './components/MotionRelief/MotionRelief';

/** Visual seat-and-spacing setup with a continuous hidden-depth field. */
export {StereoTuner,type StereoTunerProps} from './components/StereoTuner/StereoTuner';
export {Stereogram,type StereogramProps} from './components/Stereogram/Stereogram';
