import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fireEvent, userEvent, within } from 'storybook/test';
import { scenario as makeScenario, type ScenarioSpec } from 'story-spec';
import { withLibraryTheme } from '../../../storybook';
import { RegionsHarness } from './Regions.story';

// Stories tagged browser here need a laid-out page: they play in a real browser, not on zen-stories' virtual DOM.
const meta={title:'Math/Components/PlotViewport/Regions',component:RegionsHarness,decorators:[withLibraryTheme],
  render:(args,context)=><RegionsHarness {...args} renderer={context.globals.renderer}/>,
  parameters:{spec:{capability:'viewport-filled-regions',requirement:'Filled regions share the viewport camera',
    shall:'The viewport SHALL draw caller-supplied filled regions using its point projection and camera, preserving stable region identity through pan and zoom without changing caller geometry.',
    purpose:'Let applications present and select filled planar regions through the same public viewport camera as points and edges.'}},
      tags: ['browser'],} satisfies Meta<typeof RegionsHarness>;
export default meta;
type Story=StoryObj<typeof meta>;
const scenario=(spec:ScenarioSpec,base:Story={}):Story=>makeScenario(spec,base) as unknown as Story;
const state=(el:HTMLElement)=>JSON.parse(el.querySelector('[data-state]')!.textContent!);
const svg=(el:HTMLElement)=>el.querySelector('svg')!;
const region=(el:HTMLElement)=>within(el).getByRole('button',{name:'Left region'});
const activate=async(el:HTMLElement)=>{
  const node=region(el);
  await fireEvent.pointerDown(node,{button:0,pointerId:1,clientX:100,clientY:100});
  await fireEvent.pointerUp(svg(el),{button:0,pointerId:1,clientX:100,clientY:100});
};
export const CameraAlignment:Story=scenario({when:'a reader pans and zooms with one region selected',then:'its fill and boundary remain aligned with the points and the same region ID remains selected',act:async({canvasElement:el})=>{
  expect(region(el)).toHaveAttribute('aria-pressed','true');
  const plot=svg(el);plot.focus();await userEvent.keyboard('+');
  await fireEvent.pointerDown(plot,{button:0,pointerId:1,clientX:20,clientY:20});
  await fireEvent.pointerMove(plot,{pointerId:1,clientX:40,clientY:50});
  await fireEvent.pointerUp(plot,{pointerId:1,clientX:40,clientY:50});
},check:async({canvasElement:el})=>{
  expect(state(el).camera.zoom).toBeGreaterThan(1);expect(state(el).camera.x).not.toBe(0);
  expect(state(el).selectedRegionId).toBe('left');
  const polygon=region(el) as unknown as SVGPolygonElement;
  const point=el.querySelector('[data-point-id="a"] circle') as SVGCircleElement;
  const first=polygon.points.getItem(0),p=new DOMPoint(first.x,first.y).matrixTransform(polygon.getScreenCTM()!);
  const q=new DOMPoint(point.cx.baseVal.value,point.cy.baseVal.value).matrixTransform(point.getScreenCTM()!);
  expect(p.x).toBeCloseTo(q.x,4);expect(p.y).toBeCloseTo(q.y,4);
}});
export const AccessibleSelection:Story=scenario({requirement:'Region selection is controlled and accessible',shall:'The viewport SHALL expose region selection separately from point selection and report the same stable region ID on pointer activation, Enter or Space, without changing camera state on activation.',when:'a reader activates the same region by pointer and keyboard',then:'each activation reports the same region ID and leaves the camera unchanged',act:async({canvasElement:el})=>{
  await activate(el);region(el).focus();await userEvent.keyboard('{Enter} ');
},check:async({canvasElement:el})=>{
  expect(state(el).calls).toEqual(['left','left','left']);expect(state(el).selectedId).toBeNull();
  expect(state(el).camera).toEqual({x:0,y:0,zoom:1,rotation:0});expect(region(el)).toHaveAttribute('aria-pressed','true');
}});
export const InertGhost:Story=scenario({requirement:'Decorative regions are inert',shall:'A region marked decorative SHALL receive neither pointer selection nor keyboard focus and SHALL NOT intercept activation of an interactive region beneath it.',when:'a reader clicks an interactive region beneath a decorative filled ghost',then:'the interactive region is selected and the ghost produces no selection callback',act:async({canvasElement:el})=>{
  const box=region(el).getBoundingClientRect();
  const hit=document.elementFromPoint(box.x+box.width/2,box.y+box.height/2)!;
  expect(hit.getAttribute('data-region-id')).toBe('left');
  await fireEvent.pointerDown(hit,{button:0,pointerId:1,clientX:box.x+box.width/2,clientY:box.y+box.height/2});
  await fireEvent.pointerUp(svg(el),{button:0,pointerId:1,clientX:box.x+box.width/2,clientY:box.y+box.height/2});
},check:async({canvasElement:el})=>{
  const ghost=el.querySelector('[data-region-id="ghost"]')!;
  expect(getComputedStyle(ghost).pointerEvents).toBe('none');expect(ghost).not.toHaveAttribute('tabindex');
  expect(state(el).calls).toEqual(['left']);
}});
export const MalformedNeighbors:Story=scenario({requirement:'Invalid region references fail predictably',shall:'The viewport SHALL omit a region with duplicate boundary IDs, fewer than three boundary points, missing point references or non-finite coordinates, without selecting another region in its place or preventing valid regions from rendering.',when:'an application supplies malformed regions beside a valid one',then:'only valid regions are rendered and remain selectable by their original IDs',act:async({canvasElement:el})=>{await activate(el);},check:async({canvasElement:el})=>{
  expect([...el.querySelectorAll('[data-region-id]')].map(n=>n.getAttribute('data-region-id'))).toEqual(['left','right','ghost']);
  expect(state(el).calls).toEqual(['left']);
}},{args:{malformed:true}});
export const PointCompatibility:Story=scenario({requirement:'Existing point behavior remains compatible',shall:'Omitting regions SHALL preserve point and edge rendering, density behavior, point selection and camera gestures with the existing public props.',when:'an application renders an existing point-and-edge plot without regions',then:'its points, edges, selection and camera interactions behave as before',act:async({canvasElement:el})=>{
  svg(el).focus();await userEvent.keyboard('{ArrowRight}+');
},check:async({canvasElement:el})=>{
  expect(el.querySelectorAll('[data-region-id]')).toHaveLength(0);expect(el.querySelectorAll('[data-point-id]')).toHaveLength(6);
  expect(el.querySelectorAll('.zen-math-viewport__edge')).toHaveLength(1);expect(state(el).selectedId).toBe('a');expect(state(el).camera.zoom).toBe(1.25);
}},{args:{noRegions:true}});
export const DensityAndRemoval:Story=scenario({when:'an application removes the selected region from a density plot',then:'the remaining regions keep input order and density cells remain visible without a replacement selection',act:async({canvasElement:el})=>{
  expect(region(el)).toHaveAttribute('aria-pressed','true');await userEvent.click(within(el).getByRole('button',{name:'Remove selected region'}));
},check:async({canvasElement:el})=>{
  expect([...el.querySelectorAll('[data-region-id]')].map(n=>n.getAttribute('data-region-id'))).toEqual(['right','ghost']);
  expect(el.querySelectorAll('[data-bin-id]').length).toBeGreaterThan(0);expect(state(el).selectedRegionId).toBe('left');expect(state(el).calls).toEqual([]);
}},{args:{density:true}});
export const LayeringAndFocus:Story=scenario({requirement:'Region selection is controlled and accessible',when:'a reader clicks overlapping regions and tabs through the plot',then:'the later interactive region receives the pointer and focus follows supplied region order',act:async({canvasElement:el})=>{
  const box=region(el).getBoundingClientRect(),x=box.x+box.width/2,y=box.y+box.height/2;
  const hit=document.elementFromPoint(x,y)!;expect(hit.getAttribute('data-region-id')).toBe('top');
  await fireEvent.pointerDown(hit,{button:0,pointerId:1,clientX:x,clientY:y});
  await fireEvent.pointerUp(svg(el),{button:0,pointerId:1,clientX:x,clientY:y});
  svg(el).focus();await userEvent.tab();expect(region(el)).toHaveFocus();await userEvent.tab();
  expect(within(el).getByRole('button',{name:'Right region'})).toHaveFocus();await userEvent.tab();
},check:async({canvasElement:el})=>{
  expect(within(el).getByRole('button',{name:'Top region'})).toHaveFocus();expect(state(el).calls).toEqual(['top']);
}},{args:{overlap:true}});
export const DensityCompatibility:Story=scenario({requirement:'Existing point behavior remains compatible',when:'a reader activates a density cell in a plot without regions',then:'the camera zooms without inventing an individual point or region selection',act:async({canvasElement:el})=>{
  const bin=el.querySelector('[data-bin-id]')!;
  await fireEvent.pointerDown(bin,{button:0,pointerId:1,clientX:100,clientY:100});
  await fireEvent.pointerUp(svg(el),{button:0,pointerId:1,clientX:100,clientY:100});
},check:async({canvasElement:el})=>{
  expect(state(el).camera.zoom).toBe(2);expect(state(el).selectedId).toBeNull();expect(state(el).calls).toEqual([]);
}},{args:{noRegions:true,density:true}});
