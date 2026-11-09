import {useState} from 'react';
import {ProjectionView,type ProjectionViewProps} from '../ProjectionView';
import {initial,type Point} from '../model/projection';

type Pick={candidateIds:string[];input:'pointer'|'touch'|'keyboard'};
type Pose={rotation:number;pitch:number};
export const square=(z:number):Point[]=>[{x:-1,y:-1,z},{x:1,y:-1,z},{x:1,y:1,z},{x:-1,y:1,z}];
export const specimenFaces=[
 {id:'rear',label:'Rear face',points:square(1),hue:2 as const},
 {id:'front',label:'Front face',points:square(-1),hue:1 as const},
 {id:'coincident',label:'Coincident face',points:square(-1),hue:3 as const},
];
export function Interaction({legacy=false,both=false,cycle=false,invalid=false,clipped=false}:{legacy?:boolean;both?:boolean;cycle?:boolean;invalid?:boolean;clipped?:boolean}){
 const [pose,setPose]=useState<Pose>({rotation:0,pitch:0}),[selected,setSelected]=useState(['rear']);
 const [calls,setCalls]=useState<Pick[]>([]),[cameras,setCameras]=useState<Pose[]>([]),[rotations,setRotations]=useState<number[]>([]);
 const [probe,setProbe]=useState<Point>({x:1.8,y:1,z:0});
 const faces=invalid?[...specimenFaces,{id:'duplicate',points:square(0)},{id:'duplicate',points:square(0)},{id:'',points:square(0)},{points:square(0)}]:clipped?[...specimenFaces,{id:'behind',points:square(-9)},{id:'bad',points:[{x:NaN,y:0,z:0},...square(0)]}]:specimenFaces;
 const pick=(event:Pick)=>{setCalls(v=>[...v,event]);if(cycle)setSelected([event.candidateIds[(calls.length)%event.candidateIds.length]]);};
 const props:ProjectionViewProps={label:'Working view',lines:[],faces,settings:{...initial,...pose},probe,onProbeChange:setProbe,
  selectedFaceIds:selected,onFacePick:legacy?undefined:pick,
  onCameraChange:legacy?undefined:(next:Pose)=>{setPose(next);setCameras(v=>[...v,next]);},
  onRotate:legacy||both?(rotation:number)=>{setPose(v=>({...v,rotation}));setRotations(v=>[...v,rotation]);}:undefined,
 };
 return <section style={{maxWidth:720,padding:16}}>
  <h2>Identified faces and independent cameras</h2>
  <ProjectionView {...props}/>
  <ProjectionView label="Target view" lines={[]} faces={specimenFaces} settings={{...initial,rotation:15,pitch:20}}/>
  <button onClick={()=>setPose({rotation:90,pitch:90})}>Inspect at 90 degrees</button>
  <output data-state style={{display:'block',overflowWrap:'anywhere'}}>{JSON.stringify({pose,selected,calls,cameras,rotations,probe,geometry:JSON.stringify(specimenFaces)})}</output>
 </section>;
}
