/** Dimensionless, bounded demonstrations; these are analytic models, not physical solvers. */
export type SignalKind = 'traveling' | 'interference' | 'standing' | 'fourier' | 'beats' | 'modulation' | 'dispersion' | 'torus' | 'sphere' | 'torus4';
export interface SignalState { a: number; b: number; time: number; slice: number }
export interface SignalParameter { label: string; min: number; max: number; initial: number; step: number; unit?: string }
export interface SignalExperiment { label: string; a: number; b: number; notice: string }
export interface SignalSpec {
  id: SignalKind; title: string; subtitle: string; category: string; equation: string;
  a: SignalParameter; b: SignalParameter; notice: string; limits: string;
  experiments: readonly SignalExperiment[];
}
const parameter = (label: string, min: number, max: number, initial: number, step = .01, unit = ''): SignalParameter => ({ label, min, max, initial, step, unit });
export const signalExamples: readonly SignalSpec[] = [
  { id:'traveling', title:'A wave has a direction.', category:'Propagation', subtitle:'Tilt the wavefront. Follow a crest across the plane.', equation:'h(x,z,t) = sin(k(x cos α + z sin α) − t)', a:parameter('Direction',-Math.PI,Math.PI,.5,.01,'rad'), b:parameter('Wavenumber',.5,3,1.5), notice:'The surface oscillates vertically while the pattern travels perpendicular to its wavefronts.', limits:'An ideal plane wave: no damping, boundaries or source spreading. Coordinates and time are dimensionless.', experiments:[{label:'Along x',a:0,b:1.5,notice:'The slice and the wave travel in the same direction.'},{label:'Turn 90°',a:Math.PI/2,b:1.5,notice:'The x slice is flat because the wave now varies along z.'},{label:'Shorter waves',a:.5,b:3,notice:'More crests fit into the same space.'}] },
  { id:'interference', title:'Two sources. One field.', category:'Superposition', subtitle:'Move from reinforcement to cancellation by changing phase.', equation:'h = ½[sin(kr₁ − t) + sin(kr₂ − t + φ)]', a:parameter('Phase difference',0,Math.PI*2,0,.01,'rad'), b:parameter('Source separation',0,4,2), notice:'The two circular waves add point by point. Dark troughs and tall crests are a result of both sources.', limits:'Two ideal radial waves with wavenumber k=2 and constant amplitude; geometric attenuation and source cores are omitted. Exact whole-field cancellation requires coincident sources.', experiments:[{label:'Reinforce',a:0,b:0,notice:'Coincident, in-phase sources reinforce everywhere.'},{label:'Cancel',a:Math.PI,b:0,notice:'Coincident sources π out of phase cancel everywhere.'},{label:'Interference fringes',a:0,b:3,notice:'Separated sources create stationary lines of cancellation.'}] },
  { id:'standing', title:'Motion with nowhere to go.', category:'Standing waves', subtitle:'Two opposite travelers create nodes that stay still.', equation:'h = ½[sin(kx − t) + r sin(kx + t)] cos(z)', a:parameter('Reflected amplitude',0,1,1), b:parameter('Wavenumber',.5,3,1.5), notice:'At equal amplitudes, stationary nodes separate regions oscillating in opposite phase.', limits:'A prescribed separable field, not a solved membrane boundary-value problem. Only the x-directed components are counter-propagating.', experiments:[{label:'One traveler',a:0,b:1.5,notice:'Without the return wave, the pattern travels.'},{label:'Perfect standing wave',a:1,b:1.5,notice:'Equal counter-propagating waves leave fixed x nodes.'},{label:'Partial reflection',a:.4,b:1.5,notice:'Unequal amplitudes leave a moving component.'}] },
  { id:'fourier', title:'A sharp edge, made of waves.', category:'Fourier synthesis', subtitle:'Add odd harmonics and watch a smooth wave approach a square.', equation:'h = (4/π) Σₙ₌₀ᴺ⁻¹ sin[(2n+1)(x−t)] / (2n+1)ᵖ', a:parameter('Harmonic terms',1,12,3,1), b:parameter('Spectral rolloff',1,3,1), notice:'More harmonics sharpen the transition. Overshoot near the jump persists: the Gibbs phenomenon.', limits:'A finite odd-harmonic series. The square-wave interpretation applies at rolloff 1; larger exponents change the target waveform. The surface repeats the same signal along z.', experiments:[{label:'One harmonic',a:1,b:1,notice:'A single sinusoid has no sharp corners.'},{label:'Twelve harmonics',a:12,b:1,notice:'Edges sharpen, but the overshoot remains.'},{label:'Soften the spectrum',a:12,b:2.5,notice:'Faster coefficient decay suppresses high-frequency detail.'}] },
  { id:'beats', title:'Fast waves. A slow conversation.', category:'Beats', subtitle:'Nearby frequencies trade a rapidly moving carrier for a slow envelope.', equation:'h = cos(Δk x/2 − Δω t/2) sin(k̄x − ω̄t)', a:parameter('Wavenumber difference',.1,2,.6), b:parameter('Frequency difference',0,2,.3), notice:'The envelope comes from addition, not a third oscillator. Its zeros can move differently from the crests inside.', limits:'Two equal-amplitude sinusoids with mean k=2 and mean ω=2. Differences are independently controlled; no medium dispersion relation is assumed.', experiments:[{label:'Stationary envelope',a:.6,b:0,notice:'The envelope stays still while the carrier passes through.'},{label:'Envelope travels',a:.6,b:.6,notice:'The envelope velocity is Δω/Δk.'},{label:'Many beats',a:1.8,b:.3,notice:'A larger wavenumber difference packs the envelopes closer.'}] },
  { id:'modulation', title:'A signal riding another.', category:'Amplitude modulation', subtitle:'Shape a carrier with a slower envelope—and push it too far.', equation:'h = [1 + m cos(Ω(x−t))] sin(5x−5t) / 2', a:parameter('Modulation depth',0,1.5,.7), b:parameter('Modulator rate',.25,1.5,.6), notice:'The slow signal multiplies the carrier. Above depth 1, the signed envelope crosses zero and reverses phase.', limits:'A normalized AM waveform. This scene does not simulate a receiver or demodulator. Overmodulation is a sign reversal, not clipping.', experiments:[{label:'Bare carrier',a:0,b:.6,notice:'No modulation: every cycle has equal amplitude.'},{label:'Full modulation',a:1,b:.6,notice:'At depth 1 the lower envelope just touches zero.'},{label:'Overmodulate',a:1.5,b:.6,notice:'The signed envelope becomes negative and the carrier flips phase.'}] },
  { id:'dispersion', title:'A packet comes apart.', category:'Dispersion', subtitle:'Let neighboring wavenumbers travel at different speeds.', equation:'h = Σ a(k) cos[kx − ω(k)t] / Σ a(k),  ω(k)=k+β(k−2)²', a:parameter('Dispersion',0,1.5,.5), b:parameter('Spectral width',.15,1,.5), notice:'A narrow spectrum makes a broad packet. Curvature in ω(k) spreads the packet as its components lose alignment.', limits:'A finite sum of 25 modes centered at k=2 with Gaussian weights. The spatial window is finite; the packet can leave it. This is not an FFT-based PDE solver.', experiments:[{label:'No spreading',a:0,b:.5,notice:'Linear dispersion translates the packet without changing its shape.'},{label:'Spread the packet',a:1.2,b:.5,notice:'Stronger dispersion separates neighboring modes more quickly.'},{label:'Localize it',a:.5,b:1,notice:'A wider spectrum produces a narrower initial packet.'}] },
  { id:'torus', title:'Two phases make a world.', category:'Phase manifolds', subtitle:'A pair of cyclic variables lives on a torus, not on a line.', equation:'T² = S¹ × S¹;  u=t, v=ρt+φ', a:parameter('Frequency ratio',.25,3,1.5), b:parameter('Phase offset',0,Math.PI*2,0,.01,'rad'), notice:'A rational ratio closes the orbit. An irrational ratio never exactly repeats; a finite trail only shows part of that orbit.', limits:'A 2D manifold embedded in 3D. Surface coordinates are phase angles, not physical distances. The highlighted section fixes v; the moving point follows (u,v).', experiments:[{label:'Ratio 1 : 1',a:1,b:0,notice:'Both phases complete a cycle together.'},{label:'Ratio 3 : 2',a:1.5,b:0,notice:'The orbit closes after two turns of the first phase.'},{label:'Irrational ratio',a:Math.SQRT2,b:0,notice:'√2 gives no exact recurrence; the visible trail is finite.'}] },
  { id:'sphere', title:'A mode on a curved world.', category:'Spherical modes', subtitle:'A quadrupole pattern oscillates on a spherical manifold.', equation:'r = 1 + A sin²θ cos(2φ + ψ) cos t', a:parameter('Mode amplitude',0,.45,.25), b:parameter('Azimuthal phase',0,Math.PI*2,0,.01,'rad'), notice:'Four alternating lobes form a real degree-2 spherical-harmonic pattern. Their nodal meridians stay fixed as time advances.', limits:'A radial visualization of an unnormalized real l=2, |m|=2 mode, not a physical shell simulation. The domain is a 2D sphere; radial displacement is exaggerated.', experiments:[{label:'Reference sphere',a:0,b:0,notice:'Zero displacement leaves the original spherical geometry.'},{label:'Four lobes',a:.4,b:0,notice:'Positive and negative lobes alternate around the equator.'},{label:'Rotate the mode',a:.4,b:Math.PI/2,notice:'Changing azimuthal phase rotates the pattern, not the camera.'}] },
  { id:'torus4', title:'A 4D object casts a 3D shadow.', category:'Higher-dimensional geometry', subtitle:'Rotate a flat torus in four-dimensional ambient space.', equation:'(cos u, sin u, cos v, sin v) ∈ ℝ⁴ → rotate → project to ℝ³', a:parameter('4D rotation',0,Math.PI/2,.4,.01,'rad'), b:parameter('Second rotation',0,Math.PI/2,.7,.01,'rad'), notice:'The Clifford torus is intrinsically 2D, embedded in 4D. Apparent intersections belong to its 3D projection, not to the original surface.', limits:'Orthographic projection drops the fourth coordinate after two plane rotations. This is a 2D manifold in 4D, not a 4D manifold. No depth ordering can restore information lost by projection.', experiments:[{label:'Unrotated projection',a:0,b:0,notice:'Dropping one coordinate collapses distinct points onto the same shadow.'},{label:'Mix the dimensions',a:Math.PI/4,b:Math.PI/4,notice:'Rotation changes which coordinates survive the projection.'},{label:'Exchange axes',a:Math.PI/2,b:.7,notice:'A quarter turn exchanges the roles of two ambient axes.'}] },
];
export const signalSpec = (kind: SignalKind) => signalExamples.find(example => example.id === kind)!;
export const isManifold = (kind: SignalKind) => ['torus','sphere','torus4'].includes(kind);
export const initialSignal = (kind: SignalKind): SignalState => ({ a:signalSpec(kind).a.initial, b:signalSpec(kind).b.initial, time:0, slice:0 });
export function boundedParameter(p: SignalParameter, value: number): number {
  if (!Number.isFinite(value)) return p.initial;
  const bounded=Math.max(p.min,Math.min(p.max,value));
  return p.step===1?Math.round(bounded):bounded;
}
export function signalHeight(kind: SignalKind, x: number, z: number, s: SignalState): number {
  const {a,b,time:t}=s;
  switch(kind){
    case 'traveling':return Math.sin(b*(x*Math.cos(a)+z*Math.sin(a))-t);
    case 'interference':return .5*(Math.sin(2*Math.hypot(x-b/2,z)-t)+Math.sin(2*Math.hypot(x+b/2,z)-t+a));
    case 'standing':return .5*(Math.sin(b*x-t)+a*Math.sin(b*x+t))*Math.cos(z);
    case 'fourier':{let y=0;for(let n=0;n<Math.round(a);n++){const k=2*n+1;y+=Math.sin(k*(x-t))/k**b;}return y*4/Math.PI;}
    case 'beats':return Math.cos(a*x/2-b*t/2)*Math.sin(2*x-2*t);
    case 'modulation':return (1+a*Math.cos(b*(x-t)))*Math.sin(5*(x-t))/2;
    case 'dispersion':{let y=0,norm=0;for(let n=-12;n<=12;n++){const k=2+n*.16,w=Math.exp(-.5*((k-2)/b)**2);y+=w*Math.cos(k*x-(k+a*(k-2)**2)*t);norm+=w;}return y/norm;}
    default:return surfacePoint(kind,x,z,s)[1];
  }
}
export type Point3 = [number,number,number];
/** u,v are spatial coordinates for fields and phase angles for manifold examples. */
export function surfacePoint(kind: SignalKind,u: number,v: number,s: SignalState): Point3 {
  if(kind==='torus'){const r=1+.35*Math.cos(v);return [r*Math.cos(u),.35*Math.sin(v),r*Math.sin(u)];}
  if(kind==='sphere'){
    const theta=(v+Math.PI)/2;
    const r=1+s.a*Math.sin(theta)**2*Math.cos(2*u+s.b)*Math.cos(s.time);
    return [r*Math.sin(theta)*Math.cos(u),r*Math.cos(theta),r*Math.sin(theta)*Math.sin(u)];
  }
  if(kind==='torus4'){
    const x=Math.cos(u),y=Math.sin(u),z=Math.cos(v),w=Math.sin(v);
    return [x*Math.cos(s.a)-z*Math.sin(s.a),y*Math.cos(s.b)-w*Math.sin(s.b),x*Math.sin(s.a)+z*Math.cos(s.a)];
  }
  return [u,signalHeight(kind,u,v,s),v];
}
export function orbitPoint(kind: SignalKind,s: SignalState,offset=0): Point3 {
  const t=s.time+offset;
  return surfacePoint(kind,t,s.a*t+s.b,s);
}
