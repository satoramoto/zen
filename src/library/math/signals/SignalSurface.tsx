import { useEffect, useRef, useState } from 'react';
import { isManifold, orbitPoint, surfacePoint, type SignalKind, type SignalState } from './signals';
import type { MathboxSelection } from 'mathbox';

export type SignalCamera = 'perspective' | 'top' | 'front';
/** Lazy, client-only MathBox view. React owns time; the renderer draws only on invalidation. */
export function SignalSurface({kind,state,camera,resetKey=0}:{kind:SignalKind;state:SignalState;camera:SignalCamera;resetKey?:number}) {
  const host=useRef<HTMLDivElement>(null),paint=useRef<HTMLDivElement>(null);
  const latest=useRef(state);latest.current=state;
  const invalidate=useRef<()=>void>(()=>{}),setCamera=useRef<(camera:SignalCamera)=>void>(()=>{});
  const [status,setStatus]=useState<'loading'|'ready'|'unavailable'>('loading');
  useEffect(()=>{
    const element=host.current;if(!element)return;
    let cancelled=false,cleanup=()=>{};
    setStatus('loading');
    Promise.all([import('mathbox'),import('three'),import('three/examples/jsm/controls/OrbitControls.js')]).then(([{mathBox},THREE,{OrbitControls}])=>{
      if(cancelled)return;
      let box:MathboxSelection<'root'>|undefined;
      try {
        box=mathBox({element,plugins:['core','controls'],loop:{start:false},controls:{klass:OrbitControls,parameters:{enableDamping:false,enablePan:false,minDistance:2,maxDistance:12}},mathbox:{inspect:false,splash:false,warmup:0},size:{maxRenderWidth:1600,maxRenderHeight:1200},renderer:{parameters:{antialias:true,alpha:true,preserveDrawingBuffer:true}}});
        const three=box.three;
        if(!three?.renderer)throw new Error('WebGL unavailable');
        const renderer=three.renderer,controls=three.controls;
        renderer.domElement.setAttribute('aria-label','Interactive 3D mathematical surface');
        renderer.domElement.setAttribute('role','img');
        let frame=0,visible=true,disposed=false;
        let view:MathboxSelection<'cartesian'>|undefined;
        const dispose=()=>{
          if(disposed)return;
          disposed=true;cancelAnimationFrame(frame);invalidate.current=()=>{};setCamera.current=()=>{};
          controls.dispose();view?.remove();three.destroy();renderer.dispose();renderer.forceContextLoss();
        };
        cleanup=dispose;
        const draw=()=>{
          frame=0;if(disposed||!visible)return;
          for(const type of ['pre','update','render','post'])three.trigger({type});
        };
        const requestDraw=()=>{if(!disposed&&!frame)frame=requestAnimationFrame(draw);};
        invalidate.current=requestDraw;
        setCamera.current=(preset)=>{
          const positions={perspective:isManifold(kind)?[2,1.4,2.3]:[2.6,2.1,2.9],top:[0,5,.001],front:[0,.15,5]} as const;
          three.camera.position.set(...positions[preset]);controls.target.set(0,0,0);controls.update();requestDraw();
        };
        const manifold=isManifold(kind),extent=manifold?Math.PI:4;
        view=box.cartesian({range:manifold?[[-1.7,1.7],[-1.7,1.7],[-1.7,1.7]]:[[-4,4],[-1.7,1.7],[-4,4]],scale:manifold?[1.7,1.7,1.7]:[2.2,1,2.2]});
        const grid=view.grid({axes:[1,3],divideX:8,divideY:8,opacity:.15,width:1});
        const samples=view.area({width:kind==='fourier'?192:96,height:manifold?64:48,channels:3,axes:[1,3],rangeX:[-extent,extent],rangeY:[-extent,extent],expr:(emit,u,v)=>emit(...surfacePoint(kind,u,v,latest.current))});
        const surface=view.surface({points:samples,shaded:true,opacity:manifold?.55:.7,lineX:false,lineY:false,zBias:0});
        const meshSamples=view.area({width:kind==='fourier'?256:65,height:25,channels:3,axes:[1,3],rangeX:[-extent,extent],rangeY:[-extent,extent],expr:(emit,u,v)=>emit(...surfacePoint(kind,u,v,latest.current))});
        const mesh=view.surface({points:meshSamples,fill:false,lineX:true,lineY:true,opacity:.2,width:1,zBias:2});
        const section=view.interval({width:512,channels:3,range:[-extent,extent],expr:(emit,u)=>emit(...surfacePoint(kind,u,latest.current.slice,latest.current))});
        const slice=view.line({points:section,width:4,zBias:5});
        let orbit:MathboxSelection<'line'>|undefined,point:MathboxSelection<'point'>|undefined;
        if(kind==='torus'){
          const history=view.interval({width:768,channels:3,range:[-Math.PI*4,0],expr:(emit,u)=>emit(...orbitPoint(kind,latest.current,u))});
          orbit=view.line({points:history,width:3,zBias:6});
          const now=view.array({width:1,channels:3,expr:emit=>emit(...orbitPoint(kind,latest.current))});
          point=view.point({points:now,size:14,zBias:8});
        }
        if(kind==='interference'){
          const sources=view.array({width:2,channels:3,expr:(emit,i)=>emit((i===0?-1:1)*latest.current.b/2,0,0)});
          point=view.point({points:sources,size:12,zBias:8});
        }
        const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const context=canvas.getContext('2d')!;
        const color=(index:number)=>{
          const swatch=paint.current!.children[index];context.clearRect(0,0,1,1);context.fillStyle=getComputedStyle(swatch).color;context.fillRect(0,0,1,1);
          const [r,g,b]=context.getImageData(0,0,1,1).data;return new THREE.Color(r/255,g/255,b/255);
        };
        const syncTheme=()=>{
          if(disposed||!paint.current)return;
          renderer.setClearColor(color(0),1);surface.set('color',color(1));mesh.set('color',color(1));slice.set('color',color(2));grid.set('color',color(3));orbit?.set('color',color(4));point?.set('color',color(4));requestDraw();
        };
        const themeObserver=new MutationObserver(syncTheme);
        for(let node:HTMLElement|null=element;node;node=node.parentElement)themeObserver.observe(node,{attributes:true,attributeFilter:['style','class','data-mode','data-theme']});
        const resize=new ResizeObserver(([entry])=>{three.Size.set({width:entry.contentRect.width,height:entry.contentRect.height});requestDraw();});resize.observe(element);
        const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)requestDraw();});intersection.observe(element);
        const lost=(event:Event)=>{event.preventDefault();setStatus('unavailable');};renderer.domElement.addEventListener('webglcontextlost',lost);
        controls.addEventListener('change',requestDraw);
        cleanup=()=>{
          resize.disconnect();intersection.disconnect();themeObserver.disconnect();controls.removeEventListener('change',requestDraw);renderer.domElement.removeEventListener('webglcontextlost',lost);
          dispose();
        };
        syncTheme();setCamera.current(camera);draw();requestDraw();setStatus('ready');
      }catch(error){
        cleanup();if(box?.three)box.three.destroy();element.replaceChildren();setStatus('unavailable');console.error('Signal surface initialization failed',error);
      }
    }).catch(()=>{if(!cancelled)setStatus('unavailable');});
    return()=>{cancelled=true;cleanup();};
  // Quantity changes update the samplers through latest; never rebuild the GPU scene.
  },[kind,resetKey]);
  useEffect(()=>invalidate.current(),[state]);
  useEffect(()=>setCamera.current(camera),[camera]);
  return <div className="zen-signal-surface" data-renderer-state={status}>
    <div ref={host} className="zen-signal-surface__canvas" />
    <div ref={paint} aria-hidden="true" className="zen-signal-surface__paint"><i style={{color:'var(--surface-1)'}}/><i style={{color:'var(--hue-1)'}}/><i style={{color:'var(--hue-2)'}}/><i style={{color:'var(--text-3)'}}/><i style={{color:'var(--hue-3)'}}/></div>
    {status!=='ready'&&<div className="zen-signal-surface__fallback" role="status">{status==='loading'?'Preparing the 3D view…':'3D rendering is unavailable. The linked 2D view and controls still work.'}</div>}
  </div>;
}
