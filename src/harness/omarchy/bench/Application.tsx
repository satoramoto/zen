import { createContext, useContext, useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import { Button } from '../../../library/components/Button/Button';
import { Surface } from '../../../library/primitives/Surface/Surface';
import { Tabs } from '../../../library/layouts/Tabs/Tabs';
import { icons } from '../kit/application.mjs';
import type { ApplicationNode } from '../kit/application.mjs';
import './application.css';

function Action({node, children}: {node: ApplicationNode; children: React.ReactNode}) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => { if (node.autoFocus) ref.current?.querySelector('button')?.focus(); }, [node.autoFocus]);
  return <span ref={ref} className="app-action" data-om-action={node.action}>{children}</span>;
}

const Appearance = createContext('visuals');

export type ApplicationDispatch = (action: string, payload?: unknown, value?: unknown) => void;
function Icon({name}: {name?: string}) {
  const paths = name ? icons[name] : null;
  return paths ? <span className="glyph"><svg viewBox="0 0 24 24" aria-hidden="true">{paths.map((d,i)=><path key={i} d={d}/>)}</svg></span> : null;
}
const colors = ['var(--accent)', 'var(--draft)', 'var(--kv)', 'var(--system)'];
function Node({node,dispatch}: {node: ApplicationNode; dispatch: ApplicationDispatch}) {
  const appearance = useContext(Appearance);
  const children = node.children.map((child,index)=><Node key={child.key || index} node={child} dispatch={dispatch}/>);
  const emit = (value?: unknown) => { if (!node.disabled && node.action) dispatch(node.action,node.payload,value); };
  switch(node.kind) {
    case 'column': return <div className="app-column">{children}</div>;
    case 'row': return <div className="app-row">{node.children.map((child,index)=><div key={child.key || index} className={child.grow?'app-grow':undefined} style={child.width?{width:child.width}:undefined}><Node node={child} dispatch={dispatch}/></div>)}</div>;
    case 'surface': return <Surface layer={node.layer || 'raised'} className={node.layer==='float'?'app-toolbar':'telemetry-section'}>{node.label&&<div className="app-section-heading"><strong>{node.label}</strong>{node.aside&&<span>{node.aside}</span>}</div>}{children}</Surface>;
    case 'section': return <section className="app-column"><h2 className="app-section-title">{node.label}</h2>{children}</section>;
    case 'text': return <div role={node.role} className={`app-text ${node.tone==='danger'?'control-error':node.tone==='muted'?'control-caption':''}`}><span style={{fontWeight:node.strong?600:undefined}}>{node.label}</span>{node.detail&&<small>{node.detail}</small>}</div>;
    case 'link': return <a href={/^https?:\/\//.test(node.href || '') ? node.href : undefined} target="_blank" rel="noopener noreferrer">{node.label || node.href}</a>;
    case 'button': return <Action node={node}><Button label={node.label || ''} title={node.title} size="cell" variant={appearance === 'omarchy' && node.variant !== 'quiet' ? 'secondary' : node.variant || 'secondary'} hue={node.tone==='danger'?'rec':'t'} disabled={node.disabled} icon={<Icon name={node.icon}/>} onPress={()=>emit()}/></Action>;
    case 'split-button': return <div className="app-split"><Node node={{...node,kind:'button'}} dispatch={dispatch}/><select aria-label={node.selectionLabel || 'Options'} title={String(node.value || node.selectionLabel || 'Options')} value={String(node.value || '')} disabled={node.selectionDisabled} onChange={event=>dispatch(node.selectionAction!,undefined,event.target.value)}>{node.options?.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select><span className="app-split-arrow" aria-hidden="true">▾</span></div>;
    case 'hero': return <div className={`panel-hero${node.active?' hero-active':''}`}><span className="hero-icon"><Icon name={node.icon}/></span><div className="hero-copy"><div className="hero-title-row"><h1>{node.label}</h1>{node.detail&&<span className="hero-badge">{node.detail}</span>}</div><p className="hero-meta">{node.meta}</p></div></div>;
    case 'tabs': return <Tabs name={node.label || 'Navigation'} items={(node.options || []).map(o=>({id:o.value,label:o.label}))} value={String(node.value)} panelId="zen-application-content" onChange={value=>emit(value)}/>;
    case 'reading': return <div className="info-pair"><span className="info-label">{node.label}</span><span className="info-value" title={String(node.value)}>{String(node.value)}</span></div>;
    case 'meter': return <div className={`native-meter meter-${node.tone}`}><div className="info-pair"><span className="info-label">{node.label}</span><span className="info-value">{String(node.value)}</span></div><div className="meter-track" role="meter" aria-label={node.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((node.fraction || 0)*100)} aria-valuetext={String(node.value)}><span className="meter-fill" style={{width:`${(node.fraction || 0)*100}%`}}/></div></div>;
    case 'stacked-meter': return <div className="app-column"><div className="stacked-meter" aria-label={`${node.label} ${node.value}`}><div className="stacked-track">{node.segments?.map((s,i)=><span key={s.key} style={{width:`${node.total?Math.min(1,s.value/node.total)*100:0}%`,background:colors[i%colors.length]}}/>)}</div>{!!node.marker&&node.marker<1&&<i className="gtt-marker" style={{left:`${node.marker*100}%`}} title={node.markerLabel}/>}</div><div className="memory-legend">{node.segments?.map((s,i)=><span key={s.key}><i style={{background:colors[i%colors.length]}}/>{s.label} {s.value.toFixed(1)}</span>)}{!!node.marker&&<span><i className="legend-tick"/>{node.markerLabel}</span>}</div></div>;
    case 'input': return <input className="app-input" aria-label={node.label} placeholder={node.placeholder} value={String(node.value || '')} disabled={node.disabled} onChange={event=>emit(event.target.value)} onKeyDown={event=>{if(event.key==='Enter' && node.submit && !node.disabled) { event.preventDefault();dispatch(node.submit); }}}/>;
    case 'select': return <label className="app-column">{node.label}<select className="app-input" value={String(node.value || '')} disabled={node.disabled} onChange={event=>emit(event.target.value)}>{node.options?.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;
    case 'code': return <pre className="engine-logs" tabIndex={0} aria-label={node.label}>{String(node.value || '')}</pre>;
    default: throw new Error(`Unsupported application element: ${node.kind}`);
  }
}

export function Application({tree,dispatch,handleKey,appearance='visuals'}: {appearance?:string;tree:ApplicationNode;dispatch:ApplicationDispatch;handleKey?:(key:string)=>boolean}) {
  const content=useRef<HTMLDivElement>(null);
  useEffect(()=>{if(content.current)content.current.scrollTop=0;},[tree.screen]);
  return <Appearance.Provider value={appearance}><section className="zen-application" data-appearance={appearance} aria-label={tree.label} tabIndex={-1} style={{maxWidth:tree.width || 460} as CSSProperties} onKeyDown={event=>{
    if(event.defaultPrevented||event.metaKey||event.ctrlKey||event.altKey||(event.target as HTMLElement).closest('input,textarea,select'))return;
    if(handleKey?.(event.key))event.preventDefault();
  }}>
    <Node node={tree.children[0]} dispatch={dispatch}/>
    <div ref={content} id="zen-application-content" role="tabpanel" aria-label={tree.screen} className="tab-content" tabIndex={0}><div className="application-content"><Node node={tree.children[1]} dispatch={dispatch}/></div></div>
  </section></Appearance.Provider>;
}
