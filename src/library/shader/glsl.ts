// The GLSL every material is built from (docs/shader-graph.md, "The node library"): the preamble
// with every uniform a material can read, and named helper snippets the node bodies call. Ported
// from openflowfm/visuals at 3bcc202 (`client/render/glsl/{common,circuit,light,fields}.ts`), with
// the beat, energy and seed dropped: time is `uTime`, seconds on one page-wide clock.
//
// Every helper is prefixed `z` so it can't collide with a compiled variable (`v0`, `v1`, ...) or
// with the `coord` and `uv` locals `main` declares. Colours are premultiplied throughout.

/** Declares the version, precision, the varying, the output and every uniform in the contract. */
export const PREAMBLE = `#version 300 es
precision highp float;
// Required: every hash here is a 32-bit integer mixer, and a fragment shader's int defaults to
// mediump (only 16 bits guaranteed).
precision highp int;

in vec2 vUv;
out vec4 fragColor;

uniform vec2  uRes;        // the drawing size in device pixels
uniform float uPx;         // device pixels per CSS pixel
uniform float uTime;       // seconds, one page-wide clock
uniform vec4  uPointer;    // x, y (coord units), seconds since the last press (1e3 if none), 1 inside
uniform float uRadius;     // the box's corner radius in CSS pixels
uniform vec3  uTheme[7];   // ground, ink, accent, hue-1..hue-4
uniform float uDark;       // 1 in a dark scheme
uniform float uParams[64]; // every unwired number inlet

#define PI 3.14159265359
`;

/**
 * Named snippets. A node lists the ones its body calls (`NodeSpec.helpers`); `helperCode` adds
 * their dependencies (`GLSL_HELPER_DEPS`) first and includes each once.
 */
export const GLSL_HELPERS: Record<string, string> = {
  // The box: its size and the fragment's position in CSS pixels, origin top-left, y down.
  box: `
vec2 zBoxSize() { return uRes / max(uPx, 1e-4); }
vec2 zBoxPos() { return vec2(vUv.x, 1.0 - vUv.y) * zBoxSize(); }
`,

  // Integer bit-mixing (lowbias32), not fract(sin): exact wraparound, so every driver agrees.
  hash: `
uint zHashBits(uint v) {
  v ^= v >> 16; v *= 0x7feb352du;
  v ^= v >> 15; v *= 0x846ca68bu;
  v ^= v >> 16;
  return v;
}
float zHashCell(ivec2 c) {
  uint b = uint(c.x) * 0x9e3779b9u ^ uint(c.y) * 0x85ebca6bu;
  return float(zHashBits(b) & 0x00ffffffu) / 16777215.0;
}
float zHash(vec2 p) {
  uvec2 b = floatBitsToUint(p);
  return float(zHashBits(zHashBits(b.x * 0x9e3779b9u) ^ (b.y * 0x85ebca6bu)) & 0x00ffffffu) / 16777215.0;
}
`,

  // Value noise: four lattice reads, smooth-step blended. 0..1.
  noise: `
float zNoise(vec2 p) {
  ivec2 i = ivec2(floor(p));
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(zHashCell(i), zHashCell(i + ivec2(1, 0)), f.x),
             mix(zHashCell(i + ivec2(0, 1)), zHashCell(i + ivec2(1, 1)), f.x), f.y);
}
`,

  // Four octaves of value noise, each rotated so the lattice never lines up. 0..1, 4 noise reads.
  fbm: `
float zFbm(vec2 p) {
  const mat2 turn = mat2(0.8, 0.6, -0.6, 0.8);
  float total = 0.0, amp = 0.5;
  for (int i = 0; i < 4; i++) {
    total += amp * zNoise(p);
    p = turn * p * 2.03 + vec2(19.1, 7.7);
    amp *= 0.5;
  }
  return clamp((total / 0.9375 - 0.5) * 1.35 + 0.5, 0.0, 1.0);
}
`,

  // Worley F1: distance to the nearest jittered feature point in the 3x3 cells around p. 9 reads.
  worley: `
float zWorley(vec2 p) {
  ivec2 home = ivec2(floor(p));
  vec2 local = fract(p);
  float nearest = 2.0;
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      ivec2 cell = home + ivec2(x, y);
      vec2 feature = vec2(zHashCell(cell), zHashCell(cell + ivec2(37, 17)));
      nearest = min(nearest, length(vec2(x, y) + feature - local));
    }
  }
  return clamp(nearest * 0.70710678118, 0.0, 1.0);
}
`,

  // A 2x2 rotation by degrees.
  rotate: `
vec2 zRotate(vec2 p, float deg) {
  float a = radians(deg), c = cos(a), s = sin(a);
  return mat2(c, s, -s, c) * p;
}
`,

  // Two-level fBm domain warp (3 fBm reads, 12 noise reads): a first warp q, then a second read
  // through q that swings the push around. The push is in units of the feature size (1/scale).
  warp: `
vec2 zWarp(vec2 p, float amount, float scale, float speed) {
  float t = uTime * speed;
  vec2 s = p * scale + vec2(t, -0.7 * t);
  vec2 q = vec2(zFbm(s), zFbm(s + vec2(5.2, 1.3))) - 0.5;
  float r = zFbm(s + 4.0 * q + vec2(1.7, 9.2) + vec2(-0.6 * t, 0.4 * t));
  float a = r * 2.0 * PI * 2.0;
  vec2 push = q * 1.5 + vec2(cos(a), sin(a)) * (r - 0.25) * 0.5;
  return p + push * amount / max(scale, 1e-3);
}
`,

  // Rotation growing with distance from the box's centre (visuals' cSwirl, re-centred).
  swirl: `
vec2 zSwirl(vec2 p, float turns) {
  vec2 c = 0.005 * zBoxSize();
  vec2 d = p - c;
  float a = turns * 2.0 * PI * length(d);
  float co = cos(a), si = sin(a);
  return c + mat2(co, si, -si, co) * d;
}
`,

  // A decaying ring spreading from the last press, pushing points outward as it passes.
  ripple: `
vec2 zRipple(vec2 p, float strength, float speed, float decay) {
  vec2 d = p - uPointer.xy;
  float r = length(d);
  float age = max(uPointer.z, 0.0);
  float x = r - age * speed;
  float ring = exp(-x * x * 24.0) * sin(x * 18.0);
  float fade = exp(-age * decay) * smoothstep(0.0, 0.15, r);
  return p + d / max(r, 1e-4) * ring * fade * strength * 0.2;
}
`,

  // Sunlight through water: two Worley layers drifting against each other (light_caustics).
  caustics: `
float zCaustics(vec2 p, float scale, float speed, float sharpness) {
  vec2 s = p * scale * 2.0;
  vec2 sway = uTime * speed * vec2(0.6, 0.37);
  float w1 = zWorley(s + sway);
  float w2 = zWorley(s * 1.27 + vec2(17.3, 9.1) - sway * 1.4);
  float sharp = mix(2.2, 9.0, clamp(sharpness, 0.0, 1.0));
  float web = pow(clamp(1.0 - min(w1, w2), 0.0, 1.0), sharp);
  float crossings = pow(clamp((1.0 - w1) * (1.0 - w2), 0.0, 1.0), sharp * 0.5);
  return clamp(web * 0.75 + crossings * 0.55, 0.0, 1.0);
}
`,

  // 1 at the rounded-rect edge, falling to 0 at width (CSS pixels) inside. Softness 0 is a hard
  // band (anti-aliased over one device pixel), 1 a smooth falloff across the whole width.
  rim: `
float zRoundRect(vec2 p, vec2 extent, float r) {
  vec2 q = abs(p) - extent + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float zRim(float width, float softness) {
  vec2 size = zBoxSize();
  float r = clamp(uRadius, 0.0, 0.5 * min(size.x, size.y));
  float inside = -zRoundRect(zBoxPos() - 0.5 * size, 0.5 * size, r);
  float w = max(width, 1e-3);
  float aa = 1.0 / max(uPx, 1e-4);
  float s = clamp(softness, 0.0, 1.0);
  return 1.0 - smoothstep(max(w * (1.0 - s) - aa, 0.0), w, inside);
}
`,

  // The position along a CSS-style gradient line: angle 0 is to the top, 90 to the right; -1..1
  // corner to corner across the box (aspect-correct), as linear-gradient() measures it.
  line: `
float zLine(vec2 pos, vec2 size, float deg) {
  float a = radians(deg);
  vec2 dir = vec2(sin(a), -cos(a));
  float reach = 0.5 * (abs(size.x * dir.x) + abs(size.y * dir.y));
  return dot(pos - 0.5 * size, dir) / max(reach, 1e-4);
}
`,

  // A soft band across the box along angle, centred at offset (-1..1), width a fraction of it.
  sheen: `
float zSheen(float deg, float width, float offset) {
  float x = zLine(zBoxPos(), zBoxSize(), deg);
  float b = 1.0 - smoothstep(0.0, max(width, 1e-3), abs(x - offset));
  return b * b * (3.0 - 2.0 * b);
}
`,

  // A linear ramp, 0..1 along angle across the 0..1 square of p.
  gradient: `
float zGradient(vec2 p, float deg) {
  return clamp(zLine(p, vec2(1.0), deg) * 0.5 + 0.5, 0.0, 1.0);
}
`,

  // Hue rotation about the grey axis, undone and redone around the premultiply (cHue).
  hue: `
vec4 zHue(vec4 c, float shift) {
  float a = max(c.a, 1e-4);
  vec3 col = c.rgb / a;
  const vec3 k = vec3(0.57735027);
  float ang = shift * 2.0 * PI;
  float co = cos(ang);
  vec3 turned = col * co + cross(k, col) * sin(ang) + k * dot(k, col) * (1.0 - co);
  return vec4(clamp(turned, 0.0, 1.0) * c.a, c.a);
}
`,

  // Contrast (gain) about mid grey and a lift, on the unpremultiplied colour (cLevels).
  levels: `
vec4 zLevels(vec4 c, float gain, float lift) {
  float a = max(c.a, 1e-4);
  vec3 col = c.rgb / a;
  col = (col - 0.5) * exp2((gain - 0.5) * 3.0) + 0.5 + (lift - 0.5);
  return vec4(clamp(col, 0.0, 1.0) * c.a, c.a);
}
`,

  // Premultiplied compositing: b over a, and the separable modes.
  blend: `
vec4 zOver(vec4 a, vec4 b) { return b + a * (1.0 - b.a); }
vec4 zAdd(vec4 a, vec4 b) { return min(a + b, vec4(1.0)); }
vec4 zScreen(vec4 a, vec4 b) { return a + b - a * b; }
vec4 zMultiply(vec4 a, vec4 b) {
  return vec4(a.rgb * b.rgb + a.rgb * (1.0 - b.a) + b.rgb * (1.0 - a.a), a.a + b.a - a.a * b.a);
}
`,
};

/** What each helper calls, so it comes after them. */
export const GLSL_HELPER_DEPS: Record<string, string[]> = {
  noise: ['hash'],
  fbm: ['noise'],
  worley: ['hash'],
  warp: ['fbm'],
  swirl: ['box'],
  caustics: ['worley'],
  rim: ['box'],
  sheen: ['box', 'line'],
  gradient: ['line'],
};

/** The source of the named helpers and everything they depend on, each once, dependencies first. */
export function helperCode(names: readonly string[]): string {
  const done = new Set<string>();
  const out: string[] = [];
  const add = (name: string, depth: number) => {
    if (done.has(name) || depth > 32 || !Object.prototype.hasOwnProperty.call(GLSL_HELPERS, name)) return;
    for (const dep of GLSL_HELPER_DEPS[name] ?? []) add(dep, depth + 1);
    done.add(name);
    out.push(GLSL_HELPERS[name]);
  };
  for (const n of names) add(n, 0);
  return out.join('');
}
