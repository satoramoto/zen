import {useEffect,useState} from 'react';
import type {Meta,StoryObj} from '@storybook/react-vite';
import {expect,userEvent,within} from 'storybook/test';
import {Coordinates,Mafs} from 'mafs';
import {withLibraryTheme} from '../../../../storybook';
import {DragPoint} from './DragPoint';
import 'mafs/core.css';
import '../SignalPlayground/SignalPlayground.css';
function Specimen({constraint='free',label='Explore a point'}:{constraint?:'free'|'circle'|'horizontal';label?:string}){
 const [point,setPoint]=useState<[number,number]>([1,0]);
 useEffect(()=>setPoint([1,0]),[constraint]);
 return <section className="zen-signals"><Mafs height={320} pan={false} zoom={false} viewBox={{x:[-2,2],y:[-2,2]}}><Coordinates.Cartesian/><DragPoint label={label} point={point} color="var(--hue-2)" constrain={([x,y])=>constraint==='circle'?[Math.cos(Math.atan2(y,x)),Math.sin(Math.atan2(y,x))]:[Math.max(-2,Math.min(2,x)),constraint==='horizontal'?0:Math.max(-2,Math.min(2,y))]} onMove={setPoint}/></Mafs><p>Drag or use arrow keys. <output aria-label="Point coordinates">{point.map(n=>n.toFixed(2)).join(', ')}</output></p><button onClick={()=>setPoint([1,0])}>Reset point</button></section>;
}
const meta={title:'Math/Signals/Components/Drag Point',component:Specimen,decorators:[withLibraryTheme],parameters:{layout:'fullscreen'},args:{constraint:'free',label:'Explore a point'},argTypes:{constraint:{control:'inline-radio',options:['free','circle','horizontal']},label:{control:'text'}}} satisfies Meta<typeof Specimen>;
export default meta;type Story=StoryObj<typeof meta>;
export const Free:Story={};
export const Circle:Story={args:{constraint:'circle'}};
export const Horizontal:Story={args:{constraint:'horizontal'}};
// Stories tagged browser below need a laid-out page: they play in a real browser, not on zen-stories' virtual DOM.
export const Keyboard:Story={play:async({canvasElement})=>{const c=within(canvasElement),point=await c.findByRole('group',{name:'Explore a point'});point.focus();await userEvent.keyboard('{ArrowUp}');await expect(c.getByLabelText('Point coordinates')).not.toHaveTextContent('1.00, 0.00');await userEvent.click(c.getByRole('button',{name:'Reset point'}));await expect(c.getByLabelText('Point coordinates')).toHaveTextContent('1.00, 0.00');}, tags: ['browser'] };
