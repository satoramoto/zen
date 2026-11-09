import {useId,useRef,type PointerEvent} from 'react';
import {camera,clipSegment,imagePoint,imageToCamera,unCamera,type Point,type Settings,type Projection} from './model/projection';
import {projectFaces,faceCandidates} from './model/facePicking';
import {surfaceOccluders} from './model/surfaceVisibility';
import './perspective.css';
export interface ProjectionLine {a:Point;b:Point;hue?:1|2|3|4;dashed?:boolean;faint?:boolean;/** Surface ink, occluded with each named owner in opaque mode. */ faceIds?:readonly string[]}
export interface ProjectionDot {point:Point;radius?:number;hue?:1|2|3|4}
export interface ProjectionFace {points:Point[];hue?:1|2|3|4;id?:string;label?:string;/** Other contacting faces on the +1/-1 side of this face's oriented normal. Display metadata only. */ contactSides?:Readonly<Record<string,1|-1>>}
export interface ProjectionCamera {rotation:number;pitch:number}
export interface ProjectionFacePick {candidateIds:string[];input:'pointer'|'touch'|'keyboard'}
export interface ProjectionViewProps {
 label:string; lines:ProjectionLine[]; faces?:ProjectionFace[]; dots?:ProjectionDot[]; settings:Settings; projection?:Projection; probe?:Point;
 onProbeChange?(point:Point):void; onRotate?(degrees:number):void;
 /** Caller-owned identity selection; duplicate/empty face IDs are decorative. */
 selectedFaceIds?:readonly string[];
 onFacePick?(event:ProjectionFacePick):void;
 /** Takes precedence over onRotate; pitch is clamped to [-90,90]. */
 onCameraChange?(camera:ProjectionCamera):void;
 /** Image-plane half-height; the drawing has a 3:2 aspect ratio. */
 extent?:number;
 /** Off-axis image shift, used for parallel stereo cameras. */
  imageOffset?:{x:number;y:number};
  /** Opaque convex planar surfaces with depth-correct occlusion and owned ink. */
  surfaceMode?:'wire'|'opaque';
}
/** Theme-colored, near-clipped wire geometry with an invertible image-plane probe. */
export function ProjectionView({label,lines,faces=[],dots=[],settings,projection='Perspective',probe,onProbeChange,onRotate,onCameraChange,onFacePick,selectedFaceIds=[],extent=1.4,imageOffset={x:0,y:0},surfaceMode='wire'}:ProjectionViewProps){
 const maskPrefix=useId().replace(/:/g,'');
 const svg=useRef<SVGSVGElement>(null),drag=useRef<{kind:'probe'|'orbit';id:number;x:number;y:number;rotation:number;pitch:number;moved:boolean}|null>(null);
 const projectedFaces=projectFaces(faces,settings,projection,imageOffset),orbit=!!(onCameraChange||onRotate);
 const opaque=surfaceMode==='opaque',occluders=opaque?surfaceOccluders(projectedFaces,projection):new Map<number,Point[][]>();
 const maskId=(index:number)=>`${maskPrefix}-surface-${index}`;
 const polygonPoints=(points:Point[])=>points.map(p=>`${p.x},${p.y}`).join(' ');
 const drawLine=(line:ProjectionLine,i:number)=>{const clipped=clipSegment(camera(line.a,settings),camera(line.b,settings));if(!clipped)return null;const a=projected(clipped[0]),b=projected(clipped[1]);return a&&b?<line key={i} fill="none" x1={a.x} y1={-a.y} x2={b.x} y2={-b.y} stroke={line.hue?`var(--hue-${line.hue})`:'var(--border-strong)'} strokeWidth={line.hue?1.8:1} vectorEffect="non-scaling-stroke" strokeDasharray={line.dashed?'5 5':undefined} opacity={line.faint ? .25 : line.hue ? .9 : .4}/> : null;};
 const imagePosition=(x:number,y:number)=>{const matrix=svg.current?.getScreenCTM();return matrix?new DOMPoint(x,y).matrixTransform(matrix.inverse()):null;};
 const cameraChange=(rotation:number,pitch:number)=>{if(onCameraChange)onCameraChange({rotation,pitch:Math.max(-90,Math.min(90,pitch))});else onRotate?.(Math.max(-75,Math.min(75,rotation)));};
 const projected=(p:Point)=>{const q=imagePoint(p,settings.focal,projection);return q?{x:q.x+imageOffset.x,y:q.y+imageOffset.y}:null;};
 const q=probe?projected(camera(probe,settings)):null;
 const change=(x:number,y:number)=>{if(!probe||!onProbeChange)return;const z=camera(probe,settings).z;const next=unCamera(imageToCamera({x:Math.max(-extent*1.5,Math.min(extent*1.5,x))-imageOffset.x,y:Math.max(-extent,Math.min(extent,y))-imageOffset.y},z,settings.focal,projection),settings);onProbeChange(next);};
 const start=(event:PointerEvent,kind:'probe'|'orbit')=>{if(event.button!==0||drag.current)return;event.stopPropagation();event.currentTarget.setPointerCapture(event.pointerId);drag.current={kind,id:event.pointerId,x:event.clientX,y:event.clientY,rotation:settings.rotation,pitch:settings.pitch??0,moved:false};};
 const clear=(event:PointerEvent)=>{if(drag.current?.id===event.pointerId)drag.current=null;};
 return <svg ref={svg} className="zen-perspective__projection" viewBox={`${-extent*1.5} ${-extent} ${extent*3} ${extent*2}`} role="group" aria-label={label} tabIndex={orbit?0:undefined} aria-description={onCameraChange?'Drag to orbit both axes, or focus this frame and use arrow keys.':onRotate?'Drag the background or focus this frame and use left/right arrows to turn the scene.':undefined} onKeyDown={e=>{if(e.target!==e.currentTarget||!orbit)return;const dx=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0,dy=onCameraChange?(e.key==='ArrowUp'?1:e.key==='ArrowDown'?-1:0):0;if(dx||dy){e.preventDefault();cameraChange(settings.rotation+dx*2,(settings.pitch??0)+dy*2);}}}
  onPointerDown={e=>{if(orbit||onFacePick)start(e,'orbit');}} onPointerMove={e=>{const d=drag.current;if(!d||d.id!==e.pointerId)return;if(d.kind==='orbit'){d.moved ||= Math.hypot(e.clientX-d.x,e.clientY-d.y)>4;if(orbit&&(d.moved||(!onCameraChange&&!onFacePick)))cameraChange(d.rotation+(e.clientX-d.x)*.35,d.pitch-(e.clientY-d.y)*.35);return;}const p=imagePosition(e.clientX,e.clientY);if(p)change(p.x,-p.y);}}
   onPointerUp={e=>{const d=drag.current;if(!d||d.id!==e.pointerId)return;drag.current=null;if(d.kind==='orbit'&&!d.moved&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<=4&&onFacePick){const p=imagePosition(e.clientX,e.clientY);const candidateIds=p?faceCandidates(projectedFaces,p,projection,opaque):[];if(candidateIds.length)onFacePick({candidateIds,input:e.pointerType==='touch'?'touch':'pointer'});}}} onPointerCancel={clear} onLostPointerCapture={clear}>

  <path d={`M${-extent*1.5} 0H${extent*1.5}M0 ${-extent}V${extent}`} className="zen-perspective__axis"/>
   {/* Half-pixel mask bleed suppresses covered facet antialias/stroke fringes. */}
   {opaque&&<defs>{projectedFaces.map(face=><mask key={face.index} id={maskId(face.index)} maskUnits="userSpaceOnUse" x={-extent*1.5} y={-extent} width={extent*3} height={extent*2} style={{maskType:'luminance'}}><rect x={-extent*1.5} y={-extent} width={extent*3} height={extent*2} fill="white"/>{occluders.get(face.index)?.map((points,i)=><polygon key={i} points={polygonPoints(points)} fill="black" stroke="black" strokeWidth="1" vectorEffect="non-scaling-stroke"/>)}</mask>)}</defs>}
   {[...projectedFaces].sort((a,b)=>b.meanDepth-a.meanDepth||a.index-b.index).map(face=><g key={face.index} data-surface-id={opaque?face.id:undefined} mask={opaque?`url(#${maskId(face.index)})`:undefined} pointerEvents="none"><polygon points={polygonPoints(face.points)} fill={`var(--hue-${face.face.hue??1})`} opacity={opaque?1:face.id&&selectedFaceIds.includes(face.id)?'.3':'.07'}/>{opaque&&lines.filter(line=>face.id&&line.faceIds?.includes(face.id)).map(drawLine)}</g>)}
  {projectedFaces.filter(face=>face.id&&onFacePick).map(face=><polygon key={face.id} data-face-id={face.id} points={face.points.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke={selectedFaceIds.includes(face.id!)?'var(--hue-4)':'none'} strokeWidth="2" vectorEffect="non-scaling-stroke" className="zen-perspective__face" role="button" tabIndex={0} aria-label={face.face.label||face.id} aria-pressed={selectedFaceIds.includes(face.id!)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();onFacePick?.({candidateIds:[face.id!],input:'keyboard'});}}}/>)}
   {lines.filter(line=>!opaque||!line.faceIds?.length).map(drawLine)}
  {dots.map((dot,i)=>{const p=projected(camera(dot.point,settings));return p?<circle key={i} cx={p.x} cy={-p.y} r={dot.radius??.01} fill={dot.hue?`var(--hue-${dot.hue})`:'var(--text-1)'}/>:null;})}
  {q&&<g transform={`translate(${q.x} ${-q.y})`} role={onProbeChange?'button':undefined} tabIndex={onProbeChange?0:undefined} aria-label={`Move probe in ${label}`} aria-description="Drag or use arrow keys. The camera-space depth stays fixed." className="zen-perspective__handle" onPointerDown={e=>{if(onProbeChange)start(e,'probe');}} onKeyDown={e=>{const dx=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0,dy=e.key==='ArrowUp'?1:e.key==='ArrowDown'?-1:0;if(dx||dy){e.preventDefault();change(q.x+dx*.04,q.y+dy*.04);}}}>
   <circle r={extent*.09} fill="var(--hue-4)" opacity=".12"/><circle r={extent*.025} fill="var(--hue-4)" stroke="var(--surface-0)" strokeWidth="2" vectorEffect="non-scaling-stroke"/>
  </g>}
 </svg>;
}
