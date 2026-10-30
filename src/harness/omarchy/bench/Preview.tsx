import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import type {CSSProperties} from 'react';
import {createPortal} from 'react-dom';
import type {Element} from '../kit/ui.mjs';
import {arrange} from '../kit/layout.mjs';
import type {Box} from '../kit/layout.mjs';
import {themeOf} from '../kit/theme.mjs';
import type {Theme} from '../kit/theme.mjs';
import './preview.css';
export type Dispatch = (action:string,payload?:unknown,value?:unknown)=>void;
function Select({node,box,theme:t,emit}:{node:Element;box:Box;theme:Theme;emit:(v:string)=>void}) {
  const trigger=useRef<HTMLButtonElement>(null),popup=useRef<HTMLDivElement>(null);
  const [open,setOpen]=useState(false),[active,setActive]=useState(0);
  const options=[...(node.allowEmpty===false?[]:[{label:'Choose…',value:''}]),...(node.options??[])];
  const current=options.findIndex(o=>o.value===String(node.value??''));
  const optionHeight=t.popupRow??34,gap=t.optionGap??4,pad=t.popupPad??2;
  const height=Math.min(options.length*optionHeight+Math.max(0,options.length-1)*gap+(t.popupGap??2),optionHeight*8+gap*7+(t.popupGap??2));
  const rect=trigger.current?.getBoundingClientRect(),panel=trigger.current?.closest('main')?.getBoundingClientRect();
  useLayoutEffect(()=>{if(open){popup.current?.focus();popup.current?.querySelector('[aria-selected=true]')?.scrollIntoView({block:'nearest'});}},[open]);
  useEffect(()=>{if(!open)return;const close=(e:PointerEvent)=>{if(!trigger.current?.contains(e.target as Node)&&!popup.current?.contains(e.target as Node))setOpen(false);};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[open]);
  const close=()=>{setOpen(false);trigger.current?.focus();};
  const choose=(i:number)=>{if(options[i])emit(options[i].value);close();};
  return <><span style={{fontSize:t.small,lineHeight:`${t.smallLine}px`,color:t.muted,whiteSpace:'pre'}}>{box.labelLines?.join('\n')}</span>
    <button ref={trigger} className="om-field om-select-trigger" role="combobox" aria-label={node.label} aria-expanded={open} aria-haspopup="listbox" style={{top:box.controlY,height:t.control,fontSize:t.selectSize??t.size,paddingLeft:t.selectInset??10}} disabled={node.disabled} onClick={()=>{setActive(Math.max(0,current));setOpen(v=>!v);}} onKeyDown={e=>{if(['Enter',' ','ArrowDown'].includes(e.key)){e.preventDefault();e.stopPropagation();setActive(Math.max(0,current));setOpen(true);}}}>{options[current]?.label??'Choose…'}<svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" style={{position:'absolute',right:10,top:11,opacity:.83}}><path d="M2 3.5 5 6.5 8 3.5" fill="none" stroke="currentColor" strokeWidth="1"/></svg></button>
    {open&&rect&&createPortal(<div ref={popup} role="listbox" aria-label={node.label} tabIndex={-1} className="om-popup" style={{position:'fixed',zIndex:10000,left:rect.left,top:Math.min(rect.bottom+(t.popupGap??2),(panel?.bottom??innerHeight)-height),width:rect.width,height,padding:pad,background:t.background,border:`1px solid ${t.popupBorder??'var(--om-normal-border)'}`,color:t.foreground,fontFamily:t.font,fontSize:t.selectSize??t.size,boxSizing:'border-box',overflowY:'auto'}} onKeyDown={e=>{e.stopPropagation();if(['Escape','Enter',' ','ArrowDown','ArrowUp','j','k'].includes(e.key))e.preventDefault();if(e.key==='Escape')close();else if(['Enter',' '].includes(e.key))choose(active);else if(['ArrowDown','j'].includes(e.key))setActive(i=>Math.min(options.length-1,i+1));else if(['ArrowUp','k'].includes(e.key))setActive(i=>Math.max(0,i-1));}}>{options.map((o,i)=><div key={o.value} role="option" aria-selected={i===active} data-value={o.value} onPointerMove={()=>setActive(i)} onClick={()=>choose(i)} style={{height:optionHeight,marginBottom:i===options.length-1?0:gap,paddingLeft:t.selectInset??10,display:'flex',alignItems:'center',whiteSpace:'nowrap',overflow:'hidden',background:i===active?'var(--om-hover-fill)':'transparent',color:i===active?t.hoverText??t.foreground:t.foreground,cursor:'pointer'}}>{o.label}</div>)}</div>,trigger.current!.closest('.om-desktop')!)}
  </>;
}
function Range({node,box,theme:t,emit}:{node:Element;box:Box;theme:Theme;emit:(v:number)=>void}) {
  const [value,setValue]=useState(Number(node.value));
  useEffect(()=>setValue(Number(node.value)),[node.value]);
  const p=(value-(node.min??0))/((node.max??100)-(node.min??0));
  return <><span style={{fontSize:t.small,lineHeight:`${t.smallLine}px`,whiteSpace:'pre',color:t.muted}}>{box.labelLines?.join('\n')}</span>
    <div style={{position:'absolute',left:0,top:(box.controlY??0)+15,width:box.width-48,height:4,borderRadius:2,background:'var(--om-track)'}}><div style={{height:4,width:`${p*100}%`,background:t.foreground,borderRadius:2}}/></div>
    <input className="om-range" aria-label={node.label} type="range" style={{position:'absolute',left:0,top:box.controlY,width:box.width-48,height:t.control,'--om-thumb-shift':`${p*14-7}px`} as CSSProperties} min={node.min??0} max={node.max??100} step={node.step??1} disabled={node.disabled} value={value} onChange={e=>setValue(Number(e.target.value))} onPointerUp={e=>emit(Number(e.currentTarget.value))} onKeyUp={e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(e.key))emit(Number(e.currentTarget.value));}}/>
    <output style={{position:'absolute',right:0,top:(box.controlY??0)+7}}>{value}%</output></>;
}
function Tree({node,box,theme:t,dispatch}:{node:Element;box:Box;theme:Theme;dispatch:Dispatch}) {
  const emit=(v?:unknown)=>!node.disabled&&node.action&&dispatch(node.action,node.payload,v);
  const style:CSSProperties={position:'absolute',left:box.x,top:box.y,width:box.width,height:box.height};
  const marker={'data-om-kind':node.kind,'data-om-label':node.label??'','data-om-action':node.action??''};
  const children=node.children.map((n,i)=><Tree key={n.key??i} node={n} box={box.children[i]} theme={t} dispatch={dispatch}/>);
  const labelStyle:CSSProperties={fontSize:t.small,lineHeight:`${t.smallLine}px`,whiteSpace:'pre',margin:0,color:t.muted};
  let content;
  switch(node.kind) {
    case 'column': case 'row': content=children; break;
    case 'section': content=<><div className="om-section-line"/><h2 style={{...labelStyle,position:'absolute',top:14}}>{node.label?.toUpperCase()}</h2>{children}</>;break;
    case 'text': content=<><span style={{display:'block',whiteSpace:'pre',color:node.tone==='danger'?t.urgent:node.tone==='muted'?t.muted:t.foreground}}>{box.lines?.join('\n')}</span>{node.detail&&<small style={{...labelStyle,display:'block',marginTop:2}}>{box.detailLines?.join('\n')}</small>}</>;break;
    case 'button': return <button {...marker} className={`om-button${node.cursor?' om-cursor':''}`} style={style} disabled={node.disabled} aria-pressed={!!node.selected} onClick={()=>emit()}>{node.label}</button>;
    case 'toggle': content=<button className="om-toggle" role="checkbox" aria-checked={!!node.value} aria-label={node.label} disabled={node.disabled} onClick={()=>emit(!node.value)}><span style={{whiteSpace:'pre'}}>{box.labelLines?.join('\n')}</span><span className="om-switch" data-checked={!!node.value}><i/></span></button>;break;
    case 'slider': content=<Range node={node} box={box} theme={t} emit={v=>emit(v)}/>;break;
    case 'select': content=<Select node={node} box={box} theme={t} emit={v=>emit(v)}/>;break;
    case 'input': content=<><label style={labelStyle} htmlFor={`om-${node.action}`}>{box.labelLines?.join('\n')}</label><input className="om-field" id={`om-${node.action}`} style={{top:box.controlY,height:t.control}} disabled={node.disabled} value={String(node.value??'')} onChange={e=>emit(e.target.value)}/></>;break;
  }
  return <div {...marker} role={node.dialog?'dialog':undefined} aria-modal={node.dialog||undefined} className={`om-${node.kind}${node.cursor?' om-cursor':''}`} style={style} onPointerMove={()=>node.focusKey&&dispatch('cursor',node.focusKey)}>{content}</div>;
}
export function Preview({tree,dispatch,theme='tokyo',width=850,handleKey}:{tree:Element;dispatch:Dispatch;theme?:string|object;width?:number;handleKey?:(key:string)=>boolean}) {
  const ref=useRef<HTMLDivElement>(null),[available,setAvailable]=useState(width-42),[snapshot,setSnapshot]=useState<object|null>(null),t=themeOf(snapshot??theme);
  useEffect(()=>{const receive=(e:Event)=>setSnapshot((e as CustomEvent<object>).detail);window.addEventListener('omarchy-preview-theme',receive);return()=>window.removeEventListener('omarchy-preview-theme',receive);},[]);
  useLayoutEffect(()=>{const el=ref.current!;const observer=new ResizeObserver(()=>setAvailable(Math.floor(el.clientWidth-2*t.padding)));observer.observe(el);setAvailable(el.clientWidth-2*t.padding);return()=>observer.disconnect();},[t.padding]);
  const box=arrange(tree,available,t);
  const vars={'--om-bg':t.background,'--om-fg':t.foreground,'--om-muted':t.muted,'--om-accent':t.accent,'--om-danger':t.urgent,'--om-selected':t.selected??t.foreground,'--om-normal-fill':t.normalFill??'color-mix(in srgb,var(--om-fg) 4%,transparent)','--om-selected-fill':t.selectedFill??'color-mix(in srgb,var(--om-fg) 18%,transparent)','--om-selection-fill':t.selectionFill??'color-mix(in srgb,var(--om-fg) 35%,transparent)','--om-hover-fill':t.hoverFill??'color-mix(in srgb,var(--om-fg) 8%,transparent)','--om-normal-border':t.normalBorder??'color-mix(in srgb,var(--om-fg) 40%,transparent)','--om-hover-border':t.hoverBorder??'color-mix(in srgb,var(--om-fg) 25%,transparent)','--om-radius':`${t.radius}px`,fontFamily:t.font,fontSize:t.size,lineHeight:`${t.line}px`} as CSSProperties;
  Object.assign(vars,{'--om-popup-pad':`${Math.max(0,(t.popupPad??2)-1)}px`,'--om-switch-radius':t.radius>0?'11px':'0','--om-knob-radius':t.radius>0?'8px':'0'});
  return <div className="om-desktop" style={vars}><main ref={ref} className="om-plugin" tabIndex={handleKey?0:undefined} onKeyDown={e=>{if(!handleKey)return;const target=e.target as HTMLElement;if(target.tagName==='SELECT'||(target.tagName==='INPUT'&&target.getAttribute('type')!=='range'&&!['Enter','Escape'].includes(e.key)))return;const map:Record<string,string>={ArrowUp:'Up',ArrowDown:'Down',ArrowLeft:'Left',ArrowRight:'Right',' ':'Enter'};const key=e.key==='Tab'&&e.shiftKey?'Backtab':map[e.key]??e.key;if(handleKey(key))e.preventDefault();}} data-om-tree={JSON.stringify(tree)} data-om-theme={JSON.stringify(t)} style={{maxWidth:width,padding:t.padding,borderRadius:t.radius}} aria-label="Plugin preview"><div style={{position:'relative',width:box.width,height:box.height}}><Tree node={tree} box={box} theme={t} dispatch={dispatch}/></div></main></div>;
}
