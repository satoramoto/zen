import {useMemo,useState} from 'react';
import type {Meta,StoryObj} from '@storybook/react-vite';
import {expect,userEvent,within} from 'storybook/test';
import {withLibraryTheme} from '../../storybook';
import {MeshView} from './MeshView';
import {intersectMesh,solidMesh,type CuttingPlane} from './geometry';
import './lab.css';
function Specimen({object='torus',cutaway=false,tool='translate'}:{object?:'sphere'|'torus'|'ellipsoid';cutaway?:boolean;tool?:'translate'|'rotate'}){
 const mesh=useMemo(()=>solidMesh(object),[object]);const [plane,setPlane]=useState<CuttingPlane>({normal:[0,1,0],offset:.15});const section=useMemo(()=>intersectMesh(mesh,plane),[mesh,plane]);
 return <section className="zen-lab"><div className="zen-lab__card"><MeshView mesh={mesh} plane={plane} lines={section.lines} cutaway={cutaway} tool={tool} onPlaneChange={setPlane}/></div><p>Drag the plane handle. Offset: <output aria-label="Plane offset">{plane.offset.toFixed(2)}</output></p><div className="zen-lab__buttons"><button onClick={()=>setPlane({normal:[1,0,0],offset:0})}>Vertical cut</button><button onClick={()=>setPlane({normal:[0,1,0],offset:.15})}>Reset plane</button></div></section>;
}
const meta={title:'Design OS/Math/Components/Mesh View',component:Specimen,decorators:[withLibraryTheme],parameters:{layout:'fullscreen'},args:{object:'torus',cutaway:false,tool:'translate'},argTypes:{object:{control:'select',options:['sphere','torus','ellipsoid']},cutaway:{control:'boolean'},tool:{control:'inline-radio',options:['translate','rotate']}}} satisfies Meta<typeof Specimen>;
export default meta;type Story=StoryObj<typeof meta>;
export const PlaneIntersection:Story={};
export const Cutaway:Story={args:{cutaway:true}};
export const Rotation:Story={args:{object:'ellipsoid',tool:'rotate'}};
export const ResetPlane:Story={play:async({canvasElement})=>{const c=within(canvasElement);await userEvent.click(c.getByRole('button',{name:'Vertical cut'}));await expect(c.getByLabelText('Plane offset')).toHaveTextContent('0.00');await userEvent.click(c.getByRole('button',{name:'Reset plane'}));await expect(c.getByLabelText('Plane offset')).toHaveTextContent('0.15');}};
