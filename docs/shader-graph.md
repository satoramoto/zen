# Shader graph: contract

Status: **the lane's contract** (branch `shader-materials`). Written before the pieces, so the
runner, the compiler and Surface's material layer are built in parallel against it.

## The idea

zen's materials can be shaders. A material is a **Circuit** (`docs/circuit-model.md`), authored in
zen's own graph editor, compiled to one GLSL ES 3.00 fragment shader, and drawn by a small WebGL2
runner behind a `Surface`'s content. The materials then dress surfaces, including the graph
editor's own board (the "Meta" story).

Prior art: openflowfm/visuals at `3bcc202`: `client/render/gl.ts` (the runner, lifted),
`client/render/circuit.ts` (the whole-flow compiler: three typed signals, unwired inlets have
answers, numbers ride `uParams` so turning a knob never recompiles, sub-flows flattened) and
`client/render/glsl/*.ts` (the snippets the node bodies are ported from).

## Where it lives

A new area, `src/library/shader/`, exported from the package root (`src/library/index.ts`:
`export * from './shader'`). It sits below the primitives (an engine with no look of its own), so
`primitives/Surface.tsx` may import it; it imports the Circuit model's types and `flatten` from
`graph/model/circuit.ts` and nothing else from the library.

| File | What | Owner |
| --- | --- | --- |
| `shader/types.ts` | every type below | contract |
| `shader/index.ts` | the area's exports | contract |
| `shader/gl.ts`, `shader/context.ts`, `shader/support.ts`, `shader/ShaderCanvas.tsx` | the runner | runner |
| `shader/glsl.ts`, `shader/nodes.ts`, `shader/compile.ts`, `shader/compile.test.ts`, `shader/useShaderMaterial.ts` | the compiler and node library | compiler |
| `shader/materials/{water,ether,glass}.ts`, `shader/materials/index.ts` | the three materials, as Circuits | materials |
| `primitives/Surface.tsx`, `primitives/Surface.css`, `themes/materials.ts` (frost) | the material layer, its fallback, the new glass | surface |
| `graph/stories/Materials.stories.tsx`, `graph/stories/MaterialLab.tsx` (+ `.css`) | the stories | stories |

GLSL lives in TS strings. Two library rules reach it: `library.test.tsx` refuses `rgb(`, `rgba(`,
`hsl(` and `#` followed by 3–8 hex digits in component sources, and the tier scanner counts any
`<n>px` length in `graph/` TS. So no GLSL function named `rgb`/`hsl`, and no `px` in strings.

## Pin kinds

A pin's `kind` is one of three signals, each one GLSL type:

| `kind` | GLSL | Meaning |
| --- | --- | --- |
| `point` | `vec2` | a position. `coord` gives **CSS pixels / 100**, origin top-left, y down, so a material has the same grain on a chip and on a board; `uv` gives 0–1 across the box. |
| `number` | `float` | a scalar in the node's own natural range (each input lists its range). |
| `colour` | `vec4` | a **premultiplied** colour (`rgb * a, a`). |

A trace joins pins of the same kind only. The model allows any trace (kinds are the host's
concern); the compiler reports a mismatch as an error and reads that inlet as unwired.

Every outlet compiles to one expression evaluated once per fragment, at the fragment's own point:
geometry nodes move a point before a field reads it, and nothing re-reads a colour at another
point. (visuals threaded the point through colour resolution, so a lens could re-read its input
elsewhere; that's **Later**: none of the three materials needs it.)

## The node library

`SHADER_NODES: Record<string, NodeSpec>` in `shader/nodes.ts`; a chip's `type` is a key.

```ts
interface NodeInput {
  id: string; kind: PinKind; label?: string;
  default?: number;        // number inputs: the value when unwired and unset
  min?: number; max?: number; step?: number; unit?: string; // for the editor's control
  fallback?: string;       // point/colour inputs: GLSL when unwired (default: coord / transparent)
}
interface NodeOutput { id: string; kind: PinKind; label?: string }
interface NodeSpec {
  type: string; label: string; description: string;
  inputs: NodeInput[]; outputs: NodeOutput[];
  options?: Record<string, { values: readonly string[]; default: string }>; // string params: recompile
  helpers?: string[];      // names in GLSL_HELPERS this node's body calls (deduped, in order)
  emit(inputs: Record<string, string>, options: Record<string, string>, outlet: string): string;
}
```

`emit` returns the GLSL expression for one outlet, given each input as an expression (wired:
the upstream outlet's variable; unwired number: `uParams[i]`; unwired point/colour: its fallback).

Uniforms every material can read (the preamble declares them):

| Uniform | Type | Meaning |
| --- | --- | --- |
| `uRes` | `vec2` | the drawing size in device pixels |
| `uPx` | `float` | device pixels per CSS pixel (DPR × render scale) |
| `uTime` | `float` | seconds, on one page-wide clock so neighbours are in phase |
| `uPointer` | `vec4` | pointer x, y (coord units), seconds since the last press (1e3 if none), 1 when inside |
| `uRadius` | `float` | the box's corner radius in CSS pixels |
| `uTheme[7]` | `vec3` | ground (`--surface-0`), ink (`--text-1`), accent, `--hue-1`…`--hue-4`, read from the scope |
| `uDark` | `float` | 1 in a dark scheme, else 0 |
| `uParams[64]` | `float` | every unwired number inlet's value |

The first library, the smallest that makes water, ether and glass (`in → out`, ranges in brackets):

| Type | Inputs | Outputs | Options | Body (ported from) |
| --- | --- | --- | --- | --- |
| `coord` | | `p` point | | CSS position / 100 |
| `uv` | | `p` point | | 0–1 across the box |
| `time` | `speed` [0–4] =1 | `n` | | `uTime * speed` |
| `pointer` | | `p` point, `age`, `inside` | | `uPointer` |
| `value` | `value` [0–1] =0.5 | `n` | | a knob |
| `theme` | `alpha` [0–1] =1 | `c` colour | `slot`: ground, ink, accent, hue-1…hue-4 | `uTheme[slot]` premultiplied |
| `tint` | `r`,`g`,`b` [0–1] =1, `alpha` [0–1] =1 | `c` colour | | a fixed colour |
| `transform` | `p`, `scale` [0.05–10] =1, `rotate` [-180–180°] =0, `x`,`y` [-10–10] =0 | `p` | | scale, rotate, move |
| `drift` | `p`, `speed` [0–1] =0.05, `angle` [-180–180°] =0 | `p` | | `p + dir * uTime * speed` |
| `warp` | `p`, `amount` [0–2] =0.5, `scale` [0.1–8] =1, `speed` [0–1] =0.05 | `p` | | two-level fBm domain warp (common noise) |
| `swirl` | `p`, `turns` [-2–2] =0.2 | `p` | | `cSwirl` |
| `ripple` | `p`, `strength` [0–1] =0.3, `speed` [0–8] =3, `decay` [0.1–4] =1.5 | `p` | | a ring spreading from the last press |
| `noise` | `p`, `scale` [0.1–8] =1 | `n` [0–1] | | 4-octave fBm (common) |
| `caustics` | `p`, `scale` [0.1–8] =1, `speed` [0–2] =0.3, `sharpness` [0–1] =0.5 | `n` [0–1] | | two Worley layers (`light_caustics`) |
| `rim` | `width` [0–64 CSS px] =12, `softness` [0–1] =0.5 | `n` [0–1] | | 1 at the rounded-rect edge, 0 `width` inside (`uRadius`) |
| `sheen` | `angle` [-180–180°] =135, `width` [0–1] =0.35, `offset` [-1–1] =0 | `n` [0–1] | | a soft band across the box |
| `gradient` | `p` (=uv), `angle` [-180–180°] =90 | `n` [0–1] | | linear ramp across the box |
| `math` | `a` =0, `b` =1 [-10–10] | `n` | `op`: add, sub, mul, div, min, max, pow | |
| `smooth` | `n` =0.5, `low` =0, `high` =1 [0–1] | `n` | | `smoothstep(low, high, n)` |
| `mix` | `a`, `b` colour, `t` [0–1] =0.5 | `c` | | premultiplied mix |
| `fade` | `c`, `amount` [0–1] =1 | `c` | | `c * amount` |
| `hue` | `c`, `shift` [-0.5–0.5] =0 | `c` | | `cHue` |
| `levels` | `c`, `gain` =0.5, `lift` =0.5 [0–1] | `c` | | `cLevels` |
| `blend` | `a` (under), `b` (over) colour, `amount` [0–1] =1 | `c` | `mode`: over, add, screen, multiply | |
| `merge` | the chip's own in pins (all one kind) | `out` | | colours: `over` in pin order (first is bottom); numbers: sum |
| `out` | `c` colour | | | the fragment |

Pins on a chip come from its spec: `shaderChip(type, id, x, y, params?)` builds a `Chip` whose
`pins` are the spec's inputs (side `in`, `param: true` for numbers) and outputs (side `out`), each
with its `kind`. `merge` is the exception: its in pins are the chip's own (zen#66's one-inlet merge
chips grow a pin per source), its out pin is `out`.

## The compiler

```ts
compileCircuit(circuit: Circuit, module?: string /* default circuit.board */): CompileResult
interface CompileResult { frag: string | null; params: ParamSlot[]; errors: ShaderError[] }
interface ParamSlot {
  index: number;           // uParams[index]
  chip: string;            // flattened chip path: 'warp' on the board, 'smoke.warp' inside instance 'smoke'
  param: string;           // the input id (or, for a module instance, its module pin id)
  value: number; min?: number; max?: number; step?: number; label?: string; unit?: string;
}
interface ShaderError { chip?: string; pin?: string; message: string }
paramValues(circuit: Circuit, slots: ParamSlot[], module?: string): Float32Array // length 64
structureKey(circuit: Circuit, module?: string): string // equal keys ⇒ equal frag and slots
```

Pure: same input, same output; never throws; never mutates.

- **Flattening.** Buses are expanded with the model's `flatten`. A chip with `module: 'M'` is
  inlined: M's chips get ids `${instance}.${inner}` (recursively), a trace into the instance's
  pin X goes to the inner pin X `maps`, a trace out of its pin Y comes from the inner pin Y maps.
  A number `params[X]` on the instance sets the inner inlet when X is unwired, and its slot is
  named `{ chip: instance, param: X }`: a module's in pins are its knobs. Modules are shader
  functions, written once and inlined at every use.
- **Defaults.** Every unwired number inlet on a reached chip gets one slot: `params[id]` when it
  is a number, else the spec's `default`. Slots are numbered in a stable order (chips in module
  order, inputs in spec order), so `structureKey` equal ⇒ same slots. String params are options
  and compile in. Unwired point/colour inlets take their fallback.
- **Reached chips only.** Code and slots come only from chips reached backwards from `out`.
- **Errors**, all non-fatal unless noted: unknown chip type (its outlets read as unwired
  downstream), a kind mismatch (the inlet reads as unwired), a cycle (the inlet that closes it
  reads as unwired), a trace naming a missing pin, more than one `out` (the first is used). Fatal
  (`frag: null`): no `out`, or more than 64 slots.
- **Output.** `fragColor` is the `out` colour clamped to 0–1, premultiplied, plus ±0.5/255 of
  hash dither so slow gradients don't band.
- `useShaderMaterial(circuit, module?) → { frag, params: Float32Array, slots, errors }`
  recompiles only when `structureKey` changes and recomputes `params` on every change: editing a
  param updates live, rewiring recompiles.

## ShaderCanvas

```ts
interface ShaderCanvasProps extends Omit<HTMLAttributes<HTMLCanvasElement>, 'children' | 'onError'> {
  frag: string | null;            // null draws nothing
  params?: ArrayLike<number>;     // uParams, up to 64
  time?: number;                  // controlled time in seconds; unset: the page clock
  animate?: boolean;              // default true: a frame per display frame while visible; false: draw on change only
  scale?: number;                 // render resolution as a fraction of device pixels (DPR capped at 2); default 0.5
  radius?: number;                // uRadius; default the parent's computed corner radius
  interactive?: boolean;          // track the pointer over the parent element into uPointer
  onError?: (message: string) => void; // a GLSL compile or link failure (the canvas then draws nothing)
}
```

- **One WebGL2 context per page** (`shader/context.ts`), shared by every `ShaderCanvas`: browsers
  cap live contexts at about 16. It renders into one hidden canvas, grown (never shrunk) to the
  largest target, using `viewport` for each target, and each `ShaderCanvas` is a 2D canvas that
  copies its region with `drawImage` straight after. Programs are cached by frag string, so ten
  glass surfaces share one program; uniform locations are cached per program (from `gl.ts`).
- **One frame loop** for all canvases (`requestAnimationFrame`), drawing only those on screen
  (`IntersectionObserver`) and pausing while the tab is hidden.
- **Context loss**: `webglcontextlost` is prevented and the loop stops; on `webglcontextrestored`
  programs are rebuilt from their frag strings and drawing resumes. No canvas remounts.
- **Size**: a `ResizeObserver` on the canvas sizes its backing store to CSS size × min(DPR, 2) ×
  `scale`; a DPR change (a `matchMedia('(resolution: …dppx)')` listener) resizes too.
- **Theme**: `uTheme` and `uDark` are read from the canvas's computed `--surface-0`, `--text-1`,
  `--accent`, `--hue-1…4` (any CSS colour, oklch included, resolved through a 2D context) on
  mount, on resize, and at most once a second after that.
- **Reduced motion**: under `prefers-reduced-motion: reduce`, `animate` is treated as false.
- `useShaderSupport(): boolean` (`shader/support.ts`): WebGL2 can be created, and neither
  `prefers-reduced-motion: reduce` nor `prefers-reduced-transparency: reduce` is set. False on the
  server and in tests (jsdom).

## A material on a Surface

```ts
type ShaderMaterialName = 'water' | 'ether' | 'glass';
interface ShaderMaterialDef {
  name: ShaderMaterialName; label: string;
  circuit: Circuit;                // the material, authored as a Circuit
  scale: number;                   // ShaderCanvas render scale
  animate: boolean; interactive: boolean;
}
SHADER_MATERIALS: Record<ShaderMaterialName, ShaderMaterialDef> // shader/materials/index.ts
interface ShaderSource { frag: string | null; params: ArrayLike<number>; scale?: number; animate?: boolean; interactive?: boolean }
```

`Surface` gains `shader?: ShaderMaterialName | ShaderSource | false`, and a pack can give a layer
a material: `Materials.shaders?: Partial<Record<LayerName, ShaderMaterialName>>` (contract.ts).

- Which: the `shader` prop; else the scope's pack's `materials.shaders[layer]` (`useThemeScope`);
  `false` turns a pack's shader off on one surface.
- How: with a material and `useShaderSupport()`, the Surface sets `data-shader` and renders a
  `ShaderCanvas` (`lib-surface__shader`) as its first child: absolutely placed over the whole box,
  `border-radius: inherit`, `pointer-events: none`, `z-index: -1`, with the surface made a
  stacking context (`isolation: isolate`, `position: relative`, both `:where()` so a component's
  class can override). So the shader paints **over the surface's CSS fill and backdrop and under
  its content**. A named material is compiled once per page (a module cache).
- **Fallback**: without WebGL2, under reduced motion or reduced transparency, inside `Opaque`, or
  when the shader fails, no canvas is rendered (or it draws nothing) and the layer's CSS material
  is all there is. So every material is designed as translucency over its CSS layer: the CSS
  layer alone must already look finished.
- The shader can't see what's behind the page. Real blur through comes from the layer's CSS
  `backdrop-filter`; the shader adds light (rim, sheen, caustics, smoke) over it.

## The three materials

Each is a Circuit in `shader/materials/<name>.ts`, made with `shaderChip`, and editable in its
story.

- **water**: caustic light over the layer, its field gently warped so it reads as refraction, and
  a ripple from a press (`interactive`).
- **ether**: gradient smoke from the theme's hues, slow and turbulent (warped fBm), its colour
  drifting softly.
- **glass**: plain, high quality: translucency over the layer's blur, a rim light, a subtle
  highlight; static (`animate: false`), so it costs a frame only on resize or change.

### Liquid glass

zen's "liquid glass" is the **frost** materials facet (`themes/materials.ts`, `frostMaterials`,
label "Frost (visual[flow] glass)"), worn by the **visuals** pack ("visual[flow] (glass)"): float,
overlay and top layers (and graph nodes and zones) are `glass()` panes: a dark tint at 0.86–0.9
alpha over `blur(28px) saturate(1.6)`, a 7% white top edge and a lift shadow. The new glass
replaces it: frost's `glass()` recipe becomes the plain glass's CSS fallback (a lighter blur with
less saturation boost, a fuller rim, a soft highlight), and frost sets
`shaders: { float: 'glass', overlay: 'glass', top: 'glass' }` so those layers wear the shader glass
where WebGL allows.

## Stories

`Design OS/Graph/Materials/<Water|Ether|Glass|Meta>` (`graph/stories/Materials.stories.tsx`).
Each shows the material's circuit in the graph editor (`Graph` + `useCircuit`, as
`Circuit.stories.tsx` does) beside a live `Surface` wearing it, with a control per param slot:
editing a param updates live, rewiring recompiles, errors are listed. **Meta** is a graph board
whose own backdrop is a `ShaderCanvas` drawing the material built on that board. Each works in
every pack, light and dark.

## Performance

- Render scale 0.5 by default (smoke and caustics are soft); glass may use 1 since its rim is a
  line, but draws only on change.
- Off-screen and hidden-tab canvases cost nothing. Numbers ride `uParams`: no recompile on a knob.
- Fragment work: `caustics` is 2 Worley layers (18 cell reads), `warp` 3 fBm reads of 4 octaves
  (12 noise reads). A material should stay under about 40 noise reads per fragment.

## Later

- Threading the point through colour (a `sample`/lens node re-reading a colour elsewhere).
- Textures: the page behind (true refraction of what's under a water or glass pane), images, video.
- Feedback (a previous frame), multi-pass effects (bloom, real blur in the shader).
- More nodes: the rest of visuals' library (fold, tile, wobble, clouds, glow, shade, fractals).
- Editing a material in place inside an app, saving it to a pack, and a pack's own materials.
- The visuals engine (its compositor and render graph) on this compiler.
- Kind-aware connect in the editor (refusing a trace whose kinds differ).
