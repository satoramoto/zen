import {ProjectionView,type ProjectionLine} from './ProjectionView';
import type {Point} from './model/projection';
import type {StereoSettings} from './model/stereo';
export interface StereoPairProps {settings:StereoSettings;lines:ProjectionLine[];probe?:Point;onProbeChange?(point:Point):void;crossed?:boolean}
/** Two parallel pinhole cameras sharing world geometry and an explicit convergence plane. */
export function StereoPair({settings:s,lines,probe,onProbeChange,crossed=false}:StereoPairProps){
 const order: (-1|1)[]=crossed?[1,-1]:[-1,1];
 return <div className="zen-perspective__grid">{order.map(eye=><article className="zen-perspective__card" key={eye}><header><h2>{eye===-1?'Left eye':'Right eye'}</h2><small>{crossed?'crossed order':'parallel order'}</small></header><ProjectionView label={eye===-1?'Left eye image':'Right eye image'} lines={lines} settings={{eye:0,focal:s.focal,rotation:0,cameraX:s.cameraX+eye*s.separation/2,depth:0,forced:false}} imageOffset={{x:eye*s.focal*s.separation/(2*s.convergence),y:0}} probe={probe} onProbeChange={onProbeChange}/></article>)}</div>;
}
