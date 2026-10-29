import type { Element } from '../kit/ui.mjs';
import './preview.css';

export type Dispatch = (action: string, payload?: unknown, value?: unknown) => void;

/** Browser binding of the native vocabulary, not a second implementation of a plugin. */
export function Tree({ node, dispatch }: { node: Element; dispatch: Dispatch }) {
  const emit = (value?: unknown) => node.action && dispatch(node.action, node.payload, value);
  const marker = {'data-om-kind': node.kind, 'data-om-label': node.label ?? '', 'data-om-action': node.action ?? ''};
  const children = node.children.map((child, i) => <Tree key={child.key ?? i} node={child} dispatch={dispatch} />);
  switch (node.kind) {
    case 'column': return <div {...marker} className="om-column">{children}</div>;
    case 'row': return <div {...marker} className="om-row">{children}</div>;
    case 'section': return <section {...marker} className="om-section"><h2>{node.label}</h2>{children}</section>;
    case 'text': return <div {...marker} className={`om-text ${node.tone ?? ''} ${node.grow ? 'grow' : ''}`}><span>{node.label}</span>{node.detail && <small>{node.detail}</small>}</div>;
    case 'button': return <button {...marker} type="button" disabled={node.disabled} aria-pressed={node.selected} onClick={() => emit()}>{node.label}</button>;
    case 'toggle': return <label {...marker} className="om-toggle"><input type="checkbox" disabled={node.disabled} checked={Boolean(node.value)} onChange={e => emit(e.target.checked)} />{node.label}</label>;
    case 'slider': return <label {...marker} className="om-slider"><span>{node.label}</span><input aria-label={node.label} type="range" min={node.min ?? 0} max={node.max ?? 100} step={node.step ?? 1} disabled={node.disabled} value={Number(node.value)} onChange={e => emit(Number(e.target.value))} /><output>{node.value}%</output></label>;
    case 'select': return <label {...marker} className="om-select"><span>{node.label}</span><select disabled={node.disabled} value={String(node.value)} onChange={e => emit(e.target.value)}><option value="">Choose…</option>{node.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;
    case 'input': return <label {...marker} className="om-select"><span>{node.label}</span><input value={String(node.value ?? '')} disabled={node.disabled} onChange={e => emit(e.target.value)} /></label>;
  }
}

export function Preview({ tree, dispatch, theme = 'tokyo', width = 850 }: { tree: Element; dispatch: Dispatch; theme?: string; width?: number }) {
  return <div className="om-desktop" data-theme={theme}><main className="om-plugin" data-om-tree={JSON.stringify(tree)} style={{maxWidth: width}} aria-label="Plugin preview"><Tree node={tree} dispatch={dispatch} /></main></div>;
}
