import {describe,it,expect} from 'vitest';
import {reflect,refract,direction,unit,criticalAngle,defaultBench,device,traceMirror,tracePrism,traceBundle,intersectRay,add,mul,radians,type V} from './optics';
function close(a:V,b:V){expect(a.x).toBeCloseTo(b.x,8);expect(a.y).toBeCloseTo(b.y,8)}
const roomy={...defaultBench,offset:40,thickness:36,relief:5};
describe('vector laws',()=>{
 it('reflection preserves length and is its own inverse',()=>{const d=direction(23),n=unit({x:1,y:1}),r=reflect(d,n);expect(Math.hypot(r.x,r.y)).toBeCloseTo(1,12);close(reflect(r,n),d)});
 it('uses Snell on both sides and is reversible',()=>{const a=refract(direction(30),{x:0,y:-1},1,1.5);expect(a.tir).toBe(false);expect(Math.asin(a.direction.x)*180/Math.PI).toBeCloseTo(19.471220634,8);close(refract(mul(a.direction,-1),{x:0,y:1},1.5,1).direction,mul(direction(30),-1));const b=refract(direction(30),{x:0,y:-1},1.5,1);expect(Math.asin(b.direction.x)*180/Math.PI).toBeCloseTo(48.590377891,8)});
 it('distinguishes TIR from grazing critical transmission',()=>{expect(criticalAngle(1.5)).toBeCloseTo(41.810314896,8);expect(refract(direction(45),{x:0,y:-1},1.5,1).tir).toBe(true);const t=refract(direction(45),{x:0,y:-1},Math.SQRT2,1);expect(t.tir).toBe(false);expect(t.critical).toBe(true);expect(refract(direction(45),{x:0,y:-1},1.4,1).tir).toBe(false)});
 it('intersects finite segments, rejects backward/parallel hits and detects endpoints',()=>{expect(intersectRay({x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0})?.t).toBe(1);expect(intersectRay({x:2,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0})).toBeNull();expect(intersectRay({x:0,y:1},{x:0,y:1},{x:-1,y:0},{x:1,y:0})).toBeNull();expect(intersectRay({x:0,y:0},{x:1,y:0},{x:1,y:0},{x:2,y:0})).toBeNull();expect(intersectRay({x:1,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0})?.corner).toBe(true)});
});
describe('finite two-reflector systems',()=>{
 it('matches the exact on-axis prism and air paths',()=>{const p=tracePrism(defaultBench);expect(p.success).toBe(true);expect(p.events.map(e=>e.face)).toEqual(['entrance','right','left','exit']);expect(p.events.map(e=>e.kind)).toEqual(['refract','TIR','TIR','refract']);[{x:0,y:-8},{x:0,y:0},{x:-60,y:0},{x:-60,y:8}].forEach((q,i)=>close(p.events[i].point,q));const m=traceMirror(defaultBench);expect(m.success).toBe(true);expect(m.events.map(e=>e.kind)).toEqual(['mirror','mirror']);close(m.events[0].point,{x:0,y:0});close(m.events[1].point,{x:-60,y:0});expect(p.shift).toBeCloseTo(-60);expect(m.shift).toBeCloseTo(-60)});
 it('bare low-index facets leak while coatings restore reflections',()=>{const s={...defaultBench,index:1.35};const p=tracePrism(s);expect(p.success).toBe(false);expect(p.status).toContain('Leaks');expect(p.events.at(-1)?.kind).toBe('refract');const coated=tracePrism({...s,coated:true});expect(coated.success).toBe(true);expect(coated.events.map(e=>e.kind)).toEqual(['refract','coated','coated','refract']);expect(traceMirror(s).success).toBe(true)});
 it('crosses the researched off-axis TIR threshold, not a fabricated field limit',()=>{const a=tracePrism(roomy,4.7),b=tracePrism(roomy,4.9);expect(a.success).toBe(true);expect(b.success).toBe(false);expect(b.status).toContain('Leaks');const alpha=Math.asin(Math.sin(radians(4.7))/1.5)*180/Math.PI;expect(a.events[1].incidence).toBeCloseTo(45-alpha,8)});
 it('agrees with analytic bevel intersections and returns parallel output',()=>{for(const angle of [-8,-4,0,4]){const s={...roomy,angle},p=tracePrism(s);expect(p.success).toBe(true);const h=s.thickness/2,t=Math.tan(Math.asin(Math.sin(radians(angle))/s.index)),x0=s.relief*Math.tan(radians(angle)),qr=(x0+h*t)/(1+t),ql=(x0+(h+s.offset)*t)/(1+t);close(p.events[1].point,{x:qr,y:-qr});close(p.events[2].point,{x:-s.offset+ql,y:-ql});close(p.outgoing!,direction(angle));expect(p.turn).toBeCloseTo(0,8)}});
 it('clips finite apertures and does not substitute infinite mirrors',()=>{const s={...defaultBench,thickness:6,relief:35};expect(traceMirror(s,20).success).toBe(false);expect(tracePrism({...s,coated:true},20).success).toBe(false);expect(traceMirror(s,0).success).toBe(true)});
 it('continues after the second reflection if another mirror is encountered',()=>{const t=traceMirror(roomy,20);expect(t.success).toBe(false);expect(t.events.length).toBeGreaterThan(2);const tangent=Math.tan(radians(20)),q=(23+80)*tangent/(1+tangent)-40;close(t.events[2].point,{x:q,y:-q});expect(t.status).toContain('Extra reflections')});
 it('rejects a corner rather than choosing an arbitrary face normal',()=>{const eye=device(defaultBench).eye,corner={x:8,y:-8},angle=Math.atan2(corner.x-eye.x,corner.y-eye.y)*180/Math.PI;expect(traceMirror(defaultBench,angle).status).toContain('Corner');expect(tracePrism(defaultBench,angle).status).toContain('Corner')});
 it('uses uniform physical dimensions and does not move mirror geometry with index',()=>{const a=device(defaultBench),b=device({...defaultBench,index:1.8});expect(a).toEqual(b);const v=add(a.faces[0].b,mul(a.faces[0].a,-1));expect(Math.hypot(v.x,v.y)).toBeCloseTo(defaultBench.thickness*Math.SQRT2)});
});

describe('finite sampled pupil',()=>{
 it('clips an off-center pupil ray while the chief ray still passes at the same field angle',()=>{
  const s={...defaultBench,offset:40,thickness:6,relief:5,angle:2,pupil:8,coated:true};
  for(const trace of [traceMirror,tracePrism]){expect(trace(s,2,0).success).toBe(true);expect(trace(s,2,4).success).toBe(false);expect(trace(s,2,4).points[0].x).toBe(4)}
 });
 it('samples three pupil positions by five directions and retains exactly one chief ray',()=>{
  const s={...defaultBench,pupil:4};const b=traceBundle(s,false);
  expect(b).toHaveLength(15);expect(new Set(b.map(t=>t.points[0].x))).toEqual(new Set([-2,0,2]));
  expect(b.filter(t=>t.points[0].x===0&&t.angle===s.angle)).toHaveLength(1);
  expect(traceBundle({...s,pupil:0},true)).toHaveLength(5);
 });
 it('measures displacement against each sample own undeflected ray',()=>{
  for(const x of [-2,0,2]){const t=traceMirror(defaultBench,0,x);expect(t.success).toBe(true);expect(t.shift).toBeCloseTo(-defaultBench.offset,8)}
 });
});
