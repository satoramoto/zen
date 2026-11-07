import { useEffect, useState } from 'react';
import { expressionLatex } from './expression';
import { expressionTerms, termActions, type ExpressionTerm, type TermAction } from './terms';

/** Render only parser-produced LaTeX; never accepts arbitrary HTML or LaTeX commands. */
export function TermFormula({ source }: { source: string }) {
  const [rendered, setRendered] = useState<{ source: string; html: string } | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all([import('mathlive'), import('mathlive/static.css')]).then(([math]) => {
      const html = math.convertLatexToMarkup(expressionLatex(source));
      if (active) setRendered({ source, html });
    }).catch(() => { /* Readable source remains available if math rendering is unavailable. */ });
    return () => { active = false; };
  }, [source]);
  return <span className="zen-term-formula" aria-label={source}>{rendered?.source === source ? <span aria-hidden dangerouslySetInnerHTML={{ __html: rendered.html }} /> : source}</span>;
}

export function TermExplorer({ source, selected, candidates, action, proposed, problem, onSelect, onPreview, onApply, onClose, onViewGraph }: {
  source: string; selected: ExpressionTerm | null; candidates: ExpressionTerm[];
  action: TermAction | null; proposed?: string; problem?: string;
  onSelect(term: ExpressionTerm): void; onPreview(action: TermAction): void; onApply(): void; onClose(): void; onViewGraph(): void;
}) {
  const terms = expressionTerms(source);
  const choices = candidates.length > 1 ? candidates : terms;
  return <div className="zen-term-explorer" aria-label="Explore equation parts">
    <div className="zen-term-explorer__heading"><strong>Choose a part. Try a change.</strong><button onClick={onClose} aria-label="Close equation exploration">Done</button></div>
    <p>{candidates.length > 1 ? 'This part appears more than once. Choose its occurrence, in equation order.' : 'Select math in the editor, or pick a complete part below. Each chip is a safe place to experiment.'}</p>
    <div className="zen-term-explorer__parts" aria-label="Equation parts">{choices.map((term, index) => <button key={term.key} aria-pressed={selected?.key === term.key} aria-label={`Select ${term.label}, part ${terms.findIndex(t => t.key === term.key) + 1}`} onClick={() => onSelect(term)}><small>{candidates.length > 1 ? `Occurrence ${index + 1}` : term.label}</small><TermFormula source={term.source} /></button>)}</div>
    {selected && <>
      <div className="zen-term-explorer__target"><span>Changing only</span><TermFormula source={selected.source} /></div>
      <div className="zen-term-explorer__actions" aria-label="Try a transformation">{(Object.keys(termActions) as TermAction[]).filter(key => selected.hasPosition || !['repeat', 'shift'].includes(key)).map(key => <button key={key} aria-pressed={action === key} onFocus={() => onPreview(key)} onClick={() => onPreview(key)}>{termActions[key].label}</button>)}</div>
      {action && <div className="zen-term-explorer__preview" role="status"><strong>Preview only · {termActions[action].label}</strong><p>{termActions[action].detail}</p>{problem ? <p>{problem}</p> : <><TermFormula source={proposed!} /><p>Dashed curves show the proposal and its linked results. Solid curves and probe values stay as they are until you apply.</p></>}<div className="zen-term-explorer__commit"><button disabled={!!problem} onClick={onApply}>Apply change</button>{!problem && <button onClick={onViewGraph}>View proposal on graph ↓</button>}</div></div>}
    </>}
  </div>;
}
