import { useEffect, useId, useState } from 'react';
import { bookFor, examples, type ExampleId } from './catalog';

export type Voice = 'editorial' | 'everyday' | 'technical';
export interface PrincipleExampleProps {
  id: ExampleId;
  applied?: boolean;
  measure?: number;
  hue?: number;
  voice?: Voice;
  width?: number;
}
function useLiveValue<T,>(incoming: T) {
  const [value, setValue] = useState(incoming);
  useEffect(() => setValue(incoming), [incoming]);
  return [value, setValue] as const;
}
const garden = 'A small garden can change the rhythm of a whole street. Neighbors stop to talk. Children notice the first green shoots. A place once passed without a glance becomes somewhere worth returning to. The transformation begins with a little room, a little care, and enough time to notice what grows.';
const notes = 'Good notes are an invitation to return. Leave enough room for a thought to unfold, and enough structure to find it again. A clear paragraph asks little of its reader. It gives each line space, keeps a steady rhythm, and lets the words carry the meaning. When the page feels calm, attention can settle on what matters.';
const fontFamilies: Record<Voice, string> = {editorial:'Georgia, serif',everyday:'system-ui, sans-serif',technical:'ui-monospace, monospace'};
const entries = ['Rooms for listening','The shape of silence','A slower afternoon'];

export function PrincipleExample({id, applied, measure = 52, hue = 30, voice = 'editorial', width = 520}: PrincipleExampleProps) {
  const example = examples[id];
  const [active, setActive] = useLiveValue(applied ?? example.defaultApplied);
  const [lineWidth, setLineWidth] = useLiveValue(measure);
  const [surroundHue, setSurroundHue] = useLiveValue(hue);
  const [family, setFamily] = useLiveValue(voice);
  const [previewWidth, setPreviewWidth] = useLiveValue(width);
  const inputId = useId();
  const headingId = useId();
  const isRange = id === 'T2' || id === 'C3' || id === 'W3';
  const rangeValue = id === 'T2' ? lineWidth : id === 'C3' ? surroundHue : previewWidth;
  const ref = example.reference ?? bookFor(id).reference;
  const number = Object.keys(examples).indexOf(id) + 1;
  let specimen;
  switch(id) {
    case 'T1': specimen = <div className="specimen hierarchy"><div className="kicker">Field notes / Issue 08</div><div className="title">A quieter kind of city</div><div className="deck">Finding room to breathe in the places we call home.</div><div className="meta">Maya Chen · 6 minute read</div></div>; break;
    case 'T2': specimen = <div className="specimen measure-paper"><p className="reading" style={{maxWidth:`${lineWidth}ch`}}>{garden}</p><div className="measure-rule" style={{maxWidth:`${lineWidth}ch`}} aria-hidden="true"><span>←</span><span>{lineWidth} ch max</span><span>→</span></div></div>; break;
    case 'T3': specimen = <div className="specimen entries">{entries.map((entry,index) => <div className="entry" key={entry}><div className="entry-title">{entry}</div><div className="meta">{['Essay · 8 minute read','Interview · 5 minute read','Field notes · 4 minute read'][index]}</div></div>)}</div>; break;
    case 'G1': specimen = <div className="specimen"><div className="kicker section-label">A day of design / programme</div><div className="schedule">{['Opening remarks','Designing for everyday life','A conversation on craft'].map((title,index) => <div className="schedule-row" key={title}><span className="time">{['09:00','10:15','11:30'][index]}</span><div><strong>{title}</strong><div className="meta">{['Main hall','Studio two','Main hall'][index]}</div></div></div>)}</div></div>; break;
    case 'G2': specimen = <div className="specimen"><div className="kicker section-label">The neighborhood journal</div><div className="editorial"><div><div className="title">A place to pause</div><p className="editorial-copy">At the corner of the old market, a small garden makes room for conversation. What began as a few planters has become a place to meet, linger, and watch the afternoon unfold.</p></div><aside className="garden-illustration" aria-label="An original geometric illustration of a plant"><svg viewBox="0 0 140 210" role="img" aria-label="Plant in a terracotta pot"><path d="M70 157V54" stroke="#405e54" strokeWidth="4"/><path d="M70 115C21 117 22 68 26 65C61 65 74 88 70 115Z" fill="#728c77"/><path d="M70 85C116 80 122 43 114 34C78 38 67 58 70 85Z" fill="#9bab91"/><path d="M39 143H101L92 190H48Z" fill="#c67856"/><path d="M32 143H108V153H32Z" fill="#b66849"/></svg><span className="meta">Room to grow</span></aside></div></div>; break;
    case 'G3': specimen = <div className="specimen rhythm">{['01   Collect references','02   Find the structure','03   Make a first draft','04   Refine the details'].map(text => <div className="rhythm-row" key={text}>{text}</div>)}</div>; break;
    case 'C1': specimen = <div className="swatch-pair" role="img" aria-label={active ? 'Two identical gray squares on identical backgrounds' : 'Identical gray squares against light and dark backgrounds'}><div className="color-field"><div className="gray-square" style={{backgroundColor:'#929292'}}/></div><div className="color-field"><div className="gray-square" style={{backgroundColor:'#929292'}}/></div></div>; break;
    case 'C2': specimen = <div className="color-context"><div className="swatch-label"><span style={{backgroundColor:'#d79b54'}}/>Fixed accent · #D79B54</div><div className="context-ui"><div className="context-header"><span>Listening room</span><span aria-hidden="true">♫</span></div><p className="context-title">An evening, unhurried.</p><div className="accent-bar" style={{backgroundColor:'#d79b54'}}/><div className="track"><span className="accent-dot" style={{backgroundColor:'#d79b54'}}/><div>Evening collection<div className="context-meta">12 recordings · 48 minutes</div></div></div></div></div>; break;
    case 'C3': specimen = <div className="hue-field" style={{backgroundColor:`hsl(${surroundHue} 45% 55%)`}} role="img" aria-label={`Fixed gray square against a ${surroundHue} degree hue surround`}><div className="gray-square" style={{backgroundColor:'#929292'}}/></div>; break;
    case 'R1': specimen = <div className="specimen invoice"><div className="invoice-label">Balance due</div><div className="invoice-total" style={{fontSize:32,fontWeight:500}}>$240.00</div><div className="invoice-details"><span>Invoice 0042</span><span>Due October 30</span></div></div>; break;
    case 'R2': specimen = <div className="specimen tokens">{['Research notes','Reference images','Project sketches'].map((label,index) => <div className="token-row" key={label}><span className="file-symbol" aria-hidden="true">▤</span><span>{label}</span><span className="file-count">{[12,8,4][index]}</span></div>)}</div>; break;
    case 'R3': specimen = <div className="specimen"><div className="form-sample" role="img" aria-label="Illustrative contact fields showing label proximity">{['Name','Email','City'].map((label,index) => <div className="form-group" key={label}><div className="field-label">{label}</div><div className="input-sample">{['Maya Chen','maya@example.com','Portland'][index]}</div></div>)}</div></div>; break;
    case 'W1': specimen = <div className="specimen voice"><div className="kicker">A travel journal</div><div className="voice-title" style={{fontFamily:fontFamilies[family]}}>The art of getting lost</div><div className="meta">Notes from the roads we didn’t plan to take.</div></div>; break;
    case 'W2': specimen = <div className="specimen pairing"><div className="journal-nav" style={{fontFamily:active ? fontFamilies.everyday : fontFamilies.editorial}}>JOURNAL · PLACES · PEOPLE</div><div className="title">A slower afternoon</div><div className="body">A walk without a destination. A table by the window. An hour that belongs to no one else.</div></div>; break;
    case 'W3': specimen = <div className="resize-stage"><div className="responsive-shell" style={{width:`${previewWidth}px`,maxWidth:'100%',containerType:'inline-size'}}><div className="responsive-paper"><div className="journal-nav">THE SLOW JOURNAL</div><div className="responsive-title">The art of getting lost</div><div className="responsive-body">Take the side street. Leave the map folded. Some places reveal themselves only when you stop looking for a destination.</div></div></div></div>; break;
    case 'B1': specimen = <div className="specimen"><p className="leading-text" style={{fontFamily:'Georgia, serif',fontSize:17,lineHeight:active ? 1.35 : 1.05,maxWidth:'64ch'}}>{notes}</p></div>; break;
    case 'B2': specimen = <div className="specimen"><p className="emphasis-text"><span style={{fontWeight:active ? 400 : 700}}>Before closing the notebook, </span><strong>save your changes.</strong><span style={{fontWeight:active ? 400 : 700}}> You can return at any time to revise the title, add a sketch, or continue the story.</span></p></div>; break;
    case 'B3': specimen = <div className="specimen punctuation"><p>{active ? '“It’s a well-made notebook—bring it Friday, 2–4 pm.”' : '"It\'s a well-made notebook -- bring it Friday, 2-4 pm."'}</p><div className="glyph-key" aria-hidden="true"><span>{active ? '“ ”' : '" "'}<small>quotes</small></span><span>{active ? '’' : "'"}<small>apostrophe</small></span><span>{active ? '—' : '--'}<small>break</small></span><span>{active ? '–' : '-'}<small>range</small></span><span>-<small>compound</small></span></div></div>; break;
  }
  return <article className={`example example-${id}`} data-example={id} data-applied={active} aria-labelledby={headingId}>
    <div className="example-brief"><div className="eyebrow"><span className="example-number">{String(number).padStart(2,'0')}</span>{example.topic} <span className="example-code">{id}</span></div><h3 id={headingId}>{example.title}</h3><p className="axiom">{example.axiom}</p><a className="reference-link" href={ref.url} target="_blank" rel="noreferrer">{ref.label} <span aria-hidden="true">↗</span></a>{example.extraReference && <a className="reference-link" href={example.extraReference.url} target="_blank" rel="noreferrer">{example.extraReference.label} ↗</a>}</div>
    <div className="experiment"><div className="experiment-toolbar">
      {isRange ? <label className="range-control" htmlFor={inputId}><span>{example.control}<output>{rangeValue}{id==='T2' ? ' ch' : id==='C3' ? '°' : ' px'}</output></span><input id={inputId} type="range" min={id==='T2' ? 16 : id==='C3' ? 0 : 160} max={id==='T2' ? 76 : id==='C3' ? 360 : 640} value={rangeValue} onChange={event => {const value=Number(event.target.value); if(id==='T2')setLineWidth(value);else if(id==='C3')setSurroundHue(value);else setPreviewWidth(value);}}/></label> : id==='W1' ? <label className="select-control" htmlFor={inputId}><span>{example.control}</span><select id={inputId} value={family} onChange={event => setFamily(event.target.value as Voice)}><option value="editorial">Georgia · editorial</option><option value="everyday">System sans · everyday</option><option value="technical">Monospace · technical</option></select></label> : <label className="toggle-control" htmlFor={inputId}><input id={inputId} type="checkbox" checked={active} onChange={event=>setActive(event.target.checked)}/><span className="toggle-track" aria-hidden="true"/><span>{example.control}</span><span className="toggle-state" aria-hidden="true">{active ? 'ON' : 'OFF'}</span></label>}
    </div><div className="specimen-stage">{specimen}</div><p className="observation"><span>Look closely</span>{example.note}</p></div>
  </article>;
}
