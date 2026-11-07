import { project, type Point } from './projection';
export interface StereoSettings { separation:number; cameraX:number; convergence:number; focal:number }
/** Parallel cameras with off-axis image shifts, not toe-in; z is forward. */
export function stereoPoint(point:Point,s:StereoSettings,eye:-1|1){
 const image=project({x:point.x-s.cameraX-eye*s.separation/2,y:point.y,z:point.z},s.focal);
 return image?{x:image.x+eye*s.focal*s.separation/(2*s.convergence),y:image.y}:null;
}
/** Left minus right image coordinate. Zero lies on the chosen convergence plane. */
export function disparity(point:Point,s:StereoSettings){const left=stereoPoint(point,s,-1),right=stereoPoint(point,s,1);return left&&right?left.x-right.x:NaN;}
