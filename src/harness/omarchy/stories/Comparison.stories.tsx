import {useState} from 'react';
import type {Meta, StoryObj} from '@storybook/react-vite';

// Captures are reproducible local evidence, not checked-in goldens. Glob keeps a
// fresh checkout buildable before the optional capture command has been run.
const images = import.meta.glob<string>('/.shots/omarchy-ab/*/*.png', {eager: true, query: '?url', import: 'default'});
const reports = import.meta.glob<{default: {capturedAt: string; method: string; cases: {id: string; pixelMAE: string; maxGeometryDelta?:number; nativeOverflow: unknown[]; semanticNodes: number; largestGeometryDeltas: {kind: string; label: string; delta: {x: number; y: number; width: number; height: number}}[]}[]}}>('/.shots/omarchy-ab/report.json', {eager: true});
const report = Object.values(reports)[0]?.default;
const sceneIds = [...new Set(Object.keys(images).map(p => p.split('/').at(-2)!))];

function Comparison() {
  const [scene, setScene] = useState('lab');
  const [mode, setMode] = useState('Side by side');
  const [actualSize, setActualSize] = useState(false);
  const src = (file: string) => images[`/.shots/omarchy-ab/${scene}/${file}.png`];
  const result = report?.cases.find(c => c.id === scene);
  if (!sceneIds.length) return <p>Run scripts/omarchy-compare.mjs to generate native/browser captures. See docs/harness-omarchy.md.</p>;
  return <main style={{padding: 24, background: '#101116', color: '#c0caf5', font: '13px/1.6 monospace', minHeight: '100vh'}}>
    <h1>Omarchy / render A/B</h1>
    <p>Same view, theme snapshot, shared layout, panel dimensions and DPR. A is Chromium; B is the real native plugin host with installed Omarchy Ui controls and a fake controller.</p>
    <label>Scene <select value={scene} onChange={e => setScene(e.target.value)}>{sceneIds.map(id => <option key={id}>{id}</option>)}</select></label>{' '}
    <label>Compare <select value={mode} onChange={e => setMode(e.target.value)}>{['Side by side', 'Overlay', 'Pixel difference'].map(m => <option key={m}>{m}</option>)}</select></label>
    {' '}<label><input type="checkbox" checked={actualSize} onChange={e => setActualSize(e.target.checked)} /> 1:1 pixels</label>
    <p>{report?.capturedAt} · {result?.semanticNodes} matching elements · max geometry drift {result?.maxGeometryDelta??'not measured'}px · {result?.nativeOverflow.length} native horizontal overflows · pixel MAE {result?.pixelMAE}</p>
    <p>Pixel differences include font rasterization and native control styling. These are observations, not a parity pass.</p>
    <details><summary>Verified contract and remaining runtime differences</summary><ul>
      <li>Shared packing, wrapping, typography and integer rectangles remove the old tab clipping and vertical drift.</li>
      <li>Native uses the real Omarchy components. The browser receives its exact palette, state, font and shape snapshot.</li>
      <li>The open menu capture includes the actual Qt popup overlay; menu bounds are asserted too.</li>
      <li>Remaining pixel differences include glyph antialiasing and border/control rasterization. This is not a claim of byte-identical pixels or every theme/DPI combination.</li>
    </ul></details>
    {mode === 'Side by side' ? <div style={{display: 'flex', gap: 16, overflow: 'auto'}}>{['browser', 'native'].map(file => <figure key={file} style={{margin: 0, minWidth: 0, flex: actualSize ? '0 0 auto' : '1 1 0'}}><figcaption>{file === 'browser' ? 'A — Chromium' : 'B — Quickshell / Qt'}</figcaption><img src={src(file)} alt={`${scene} ${file}`} style={{display: 'block', width: actualSize ? undefined : '100%', maxWidth: actualSize ? 'none' : '100%'}} /></figure>)}</div>
      : <img src={src(mode === 'Overlay' ? 'overlay' : 'difference')} alt={`${scene} ${mode}`} style={{display: 'block', maxWidth: actualSize ? 'none' : '100%'}} />}
    <details><summary>Measured geometry deltas (native minus browser, px)</summary><table><thead><tr><th>Element</th><th>Δx</th><th>Δy</th><th>Δwidth</th><th>Δheight</th></tr></thead><tbody>{result?.largestGeometryDeltas.map((n, i) => <tr key={i}><td>{n.kind} {n.label}</td><td>{n.delta.x}</td><td>{n.delta.y}</td><td>{n.delta.width}</td><td>{n.delta.height}</td></tr>)}</tbody></table></details>
  </main>;
}
const meta = {title: 'Omarchy/Lab/Render comparison', component: Comparison, parameters: {layout: 'fullscreen'}} satisfies Meta<typeof Comparison>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Captured: Story = {};
