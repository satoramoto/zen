import {useEffect,useRef,useState} from 'react';
import {type CuttingPlane,type TriangleMesh,type Vec3} from './geometry';
export interface MeshViewProps {mesh:TriangleMesh;lines?:Vec3[][];probe?:Vec3;plane?:CuttingPlane;cutaway?:boolean;tool?:'translate'|'rotate';onPlaneChange?:(plane:CuttingPlane)=>void;resetKey?:number}
/** Shared lazy Three viewport for sampled surfaces and actual mesh-plane intersections. */
export function MeshView(props:MeshViewProps){
 const host=useRef<HTMLDivElement>(null),paint=useRef<HTMLDivElement>(null),latest=useRef(props);latest.current=props;
 const update=useRef(()=>{});const [status,setStatus]=useState('loading');
 useEffect(()=>{
  let cancelled=false,cleanup=()=>{};const element=host.current!;setStatus('loading');
  Promise.all([import('three'),import('three/examples/jsm/controls/OrbitControls.js'),import('three/examples/jsm/controls/TransformControls.js')]).then(([T,{OrbitControls},{TransformControls}])=>{
   if(cancelled)return;
   try{
    const renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.localClippingEnabled=true;element.append(renderer.domElement);renderer.domElement.setAttribute('aria-label','Interactive mathematical object');renderer.domElement.setAttribute('role','img');
    cleanup=()=>{renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
    const scene=new T.Scene(),camera=new T.PerspectiveCamera(40,1,.01,100);camera.position.set(3.4,2.6,4.3);
    const orbit=new OrbitControls(camera,renderer.domElement);orbit.enablePan=false;orbit.minDistance=2.5;orbit.maxDistance=12;orbit.target.set(0,0,0);orbit.update();
    scene.add(new T.AmbientLight(0xffffff,.7));const light=new T.DirectionalLight(0xffffff,.8);light.position.set(3,6,5);scene.add(light);
    const material=new T.MeshStandardMaterial({side:T.DoubleSide,transparent:true,opacity:.75,roughness:.7});
    const object=new T.Mesh(new T.BufferGeometry(),material);scene.add(object);
    const contourMaterial=new T.LineBasicMaterial({depthTest:false});const contours=new T.LineSegments(new T.BufferGeometry(),contourMaterial);contours.renderOrder=5;scene.add(contours);
    const pointMaterial=new T.MeshBasicMaterial({depthTest:false});const point=new T.Mesh(new T.SphereGeometry(.035,12,8),pointMaterial);point.renderOrder=6;scene.add(point);
    const planeMaterial=new T.MeshBasicMaterial({side:T.DoubleSide,transparent:true,opacity:.12,depthWrite:false});const planeObject=new T.Mesh(new T.PlaneGeometry(3.4,3.4),planeMaterial);scene.add(planeObject);
    const clip=new T.Plane();const gizmo=new TransformControls(camera,renderer.domElement);gizmo.setSize(.85);gizmo.setSpace('local');scene.add(gizmo);
    const grid=new T.GridHelper(3.6,12);grid.position.y=-1.5;scene.add(grid);
    let frame=0,visible=true,disposed=false,previous:TriangleMesh|undefined;
    const request=()=>{if(!frame&&!disposed)frame=requestAnimationFrame(draw);};
    const draw=()=>{frame=0;if(disposed||!visible)return;const w=element.clientWidth,h=element.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.render(scene,camera);};
    const scratch=document.createElement('canvas').getContext('2d')!;
    const color=(i:number)=>{scratch.fillStyle=getComputedStyle(paint.current!.children[i]).color;scratch.fillRect(0,0,1,1);const [r,g,b]=scratch.getImageData(0,0,1,1).data;return new T.Color(r/255,g/255,b/255);};
    const theme=()=>{renderer.setClearColor(color(0));material.color.copy(latest.current.mesh.colors?new T.Color(1,1,1):color(1));contourMaterial.color.copy(color(2));pointMaterial.color.copy(color(3));planeMaterial.color.copy(color(2));const m=grid.material as import('three').LineBasicMaterial;m.color.copy(color(4));m.opacity=.3;m.transparent=true;request();};
    const sync=()=>{
     const p=latest.current;
     if(previous!==p.mesh){previous=p.mesh;const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(p.mesh.positions,3));geometry.setIndex(p.mesh.indices);geometry.computeVertexNormals();if(p.mesh.colors)geometry.setAttribute('color',new T.Float32BufferAttribute(p.mesh.colors,3));object.geometry.dispose();object.geometry=geometry;material.vertexColors=!!p.mesh.colors;material.needsUpdate=true;theme();}
     const segments:number[]=[];for(const line of p.lines??[])for(let i=1;i<line.length;i++)segments.push(...line[i-1],...line[i]);contours.geometry.dispose();contours.geometry=new T.BufferGeometry();contours.geometry.setAttribute('position',new T.Float32BufferAttribute(segments,3));
     point.visible=!!p.probe;if(p.probe)point.position.set(...p.probe);
     planeObject.visible=!!p.plane;
     if(p.plane){const n=new T.Vector3(...p.plane.normal).normalize();clip.set(n,-p.plane.offset);if(!gizmo.dragging){planeObject.position.copy(n).multiplyScalar(p.plane.offset);planeObject.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),n);}if(!gizmo.object)gizmo.attach(planeObject);gizmo.setMode(p.tool??'translate');gizmo.showX=gizmo.showY=p.tool==='rotate';gizmo.showZ=true;gizmo.enabled=!!p.onPlaneChange;gizmo.visible=!!p.onPlaneChange;}else {gizmo.detach();}
     material.clippingPlanes=p.cutaway&&p.plane?[clip]:[];request();
    };
    update.current=sync;
    const changed=()=>{if(!gizmo.dragging)return;const n=new T.Vector3(0,0,1).applyQuaternion(planeObject.quaternion).normalize();latest.current.onPlaneChange?.({normal:n.toArray() as Vec3,offset:Math.max(-1.7,Math.min(1.7,planeObject.position.dot(n)))});request();};
    const dragging=()=>{orbit.enabled=!gizmo.dragging;if(!gizmo.dragging)sync();};
    gizmo.addEventListener('objectChange',changed);gizmo.addEventListener('dragging-changed',dragging);gizmo.addEventListener('change',request);orbit.addEventListener('change',request);
    const resize=new ResizeObserver(request);resize.observe(element);const intersection=new IntersectionObserver(([e])=>{visible=e.isIntersecting;if(visible)request();});intersection.observe(element);
    const observer=new MutationObserver(theme);for(let e:HTMLElement|null=element;e;e=e.parentElement)observer.observe(e,{attributes:true,attributeFilter:['style','class','data-mode','data-theme']});
    const lost=(e:Event)=>{e.preventDefault();setStatus('unavailable');};renderer.domElement.addEventListener('webglcontextlost',lost);
    cleanup=()=>{disposed=true;cancelAnimationFrame(frame);update.current=()=>{};resize.disconnect();intersection.disconnect();observer.disconnect();orbit.dispose();gizmo.dispose();object.geometry.dispose();contours.geometry.dispose();point.geometry.dispose();planeObject.geometry.dispose();grid.geometry.dispose();(grid.material as import('three').Material).dispose();for(const m of [material,contourMaterial,pointMaterial,planeMaterial])m.dispose();renderer.domElement.removeEventListener('webglcontextlost',lost);renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove();};
    sync();theme();setStatus('ready');
   }catch{cleanup();element.replaceChildren();setStatus('unavailable');}
  }).catch(()=>{if(!cancelled)setStatus('unavailable');});
  return()=>{cancelled=true;cleanup();};
 },[props.resetKey]);
 useEffect(()=>update.current(),[props.mesh,props.lines,props.probe,props.plane,props.cutaway,props.tool]);
 return <div className="zen-lab__mesh" data-renderer-state={status}><div className="zen-lab__canvas" ref={host}/><div className="zen-lab__paint" ref={paint} aria-hidden="true">{['--surface-1','--hue-1','--hue-2','--hue-3','--border-strong'].map(v=><i key={v} style={{color:`var(${v})`}}/>)}</div>{status!=='ready'&&<p className="zen-lab__fallback" role="status">{status==='loading'?'Preparing the object…':'3D unavailable. The linked 2D views and controls remain usable.'}</p>}</div>;
}
