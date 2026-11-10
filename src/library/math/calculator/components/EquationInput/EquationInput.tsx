import { useEffect, useRef, useState } from 'react';
import type { MathfieldElement } from 'mathlive';
import { bindEquationHighlighting } from '../../highlighting';
import { expressionLatex } from '../../expression';
import './EquationInput.css';

export interface EquationInputProps {
  id: string;
  label: string;
  /** Zen's supported expression source. User edits are not rewritten into the caret. */
  value: string;
  onChange(value: string): void;
  onFocus?(): void;
  onParameter?(name: string): void;
  /** A complete selected expression; repeated occurrences are resolved by the caller. */
  onTermSelection?(source: string): void;
  invalid?: boolean;
  /** Syntax colors are display-only; references f/g/h follow the calculator's curve colors. */
  highlighting?: boolean;
  activeParameter?: string | null;
  showColorKey?: boolean;
}
/** Client-only MathLive binding. LaTeX stays local; validated source flows to the caller. */
export function EquationInput(props: EquationInputProps) {
  const host = useRef<HTMLDivElement>(null), field = useRef<MathfieldElement | null>(null);
  const latest = useRef(props); latest.current = props;
  const decoration = useRef<ReturnType<typeof bindEquationHighlighting> | null>(null);
  const [highlighting, setHighlighting] = useState(props.highlighting ?? true);
  useEffect(() => setHighlighting(props.highlighting ?? true), [props.highlighting]);
  const keyboardRequested = useRef(false);
  const emitted = useRef(props.value), external = useRef(props.value);
  const [ready, setReady] = useState(false), [failure, setFailure] = useState(false);
  const [plain, setPlain] = useState(false), [message, setMessage] = useState('');
  useEffect(() => {
    let cancelled = false, dispose = () => {};
    Promise.all([import('mathlive'), import('../../mathInput'), import('mathlive/fonts.css?inline')]).then(([{ MathfieldElement, initVirtualKeyboardInCurrentBrowsingContext }, { latexExpression }, fonts]) => {
      if (cancelled || !host.current) return;
      // Lazy, bundled fonts: other Zen consumers do not pay for math fonts in zen.css.
      if (!document.querySelector('style[data-zen-equation-fonts]')) {
        const style = document.createElement('style'); style.dataset.zenEquationFonts = ''; style.textContent = fonts.default; document.head.append(style);
      }
      // No runtime CDN or audio downloads.
      MathfieldElement.fontsDirectory = null; MathfieldElement.soundsDirectory = null;
      if (window.parent !== window) initVirtualKeyboardInCurrentBrowsingContext();
      const element = new MathfieldElement(); field.current = element;
      element.id = latest.current.id; element.setAttribute('aria-label', latest.current.label);
      element.setAttribute('role', 'textbox'); element.setAttribute('aria-multiline', 'false');
      element.mathVirtualKeyboardPolicy = 'manual';
      host.current.append(element); element.menuItems = [];
      element.smartFence = true;
      element.inlineShortcuts = { ...element.inlineShortcuts, pi: '\\pi' };
      element.value = expressionLatex(latest.current.value || '0');
      emitted.current = latest.current.value; external.current = latest.current.value;
      decoration.current = bindEquationHighlighting(element, { enabled: latest.current.highlighting ?? true, activeParameter: latest.current.activeParameter });
      const keyboard = window.mathVirtualKeyboard;
      let previous: { container: typeof keyboard.container; layouts: typeof keyboard.layouts } | null = null;
      const focus = () => {
        latest.current.onFocus?.();
        if (!previous) previous = { container: keyboard.container, layouts: keyboard.layouts };
        keyboard.container = host.current;
        keyboard.layouts = [{ label: 'Explore', rows: [
          ['x', 't', 'a', 'b', '\\pi', '+', '-', '[backspace]'],
          ['1', '2', '3', '4', '5', '\\times', '\\frac{#@}{#?}', '#@^{#?}'],
          ['6', '7', '8', '9', '0', '.', '(', ')'],
          ['\\sin', '\\cos', '\\sqrt{#0}', 'e^{#?}', '[left]', '[right]', '[hide-keyboard]'],
        ] }, 'alphabetic'];
        if (keyboardRequested.current || matchMedia('(pointer: coarse)').matches) keyboard.show();
        keyboardRequested.current = false;
      };
      const release = () => {
        if (!previous) return;
        keyboard.hide(); keyboard.container = previous.container; keyboard.layouts = previous.layouts; previous = null;
      };
      const input = (event: Event) => {
        if ((event as InputEvent).isComposing) return;
        try {
          const source = latexExpression(element.value);
          setMessage(''); emitted.current = source; latest.current.onChange(source);
        } catch (error) {
          setMessage(error instanceof Error ? error.message : 'Finish this expression.');
          emitted.current = ''; latest.current.onChange('');
        }
      };
      const selection = () => {
        const selected = element.getValue(element.selection, 'latex') || element.getValue(Math.max(0, element.position - 1), element.position, 'latex');
        if (/^[a-z]$/.test(selected)) latest.current.onParameter?.(selected);
        if (!element.selectionIsCollapsed && latest.current.onTermSelection) {
          try { latest.current.onTermSelection(latexExpression(selected)); } catch { /* Partial syntax is not a complete term. */ }
        }
      };
      element.addEventListener('input', input); element.addEventListener('compositionend', input);
      element.addEventListener('focus', focus); element.addEventListener('blur', release); element.addEventListener('selection-change', selection);
      dispose = () => { decoration.current?.destroy(); decoration.current = null; release(); element.removeEventListener('input', input); element.removeEventListener('compositionend', input); element.removeEventListener('focus', focus); element.removeEventListener('blur', release); element.removeEventListener('selection-change', selection); element.remove(); field.current = null; };
      setReady(true);
    }).catch(() => { field.current?.remove(); field.current = null; if (!cancelled) { setFailure(true); setPlain(true); } });
    return () => { cancelled = true; dispose(); };
  }, []);
  useEffect(() => {
    if (props.value === external.current) return;
    external.current = props.value;
    // Ignore our own input echo: replacing the value here would reset selection and undo.
    if (props.value === emitted.current) return;
    if (field.current) { try { field.current.setValue(expressionLatex(props.value), { silenceNotifications: true }); setMessage(''); } catch { /* An unfinished plain-text draft stays in the plain editor. */ } }
  }, [props.value]);
  useEffect(() => { if (field.current) { field.current.id = plain ? `${props.id}-typeset` : props.id; field.current.setAttribute('aria-label', props.label); } }, [props.id, props.label, plain, ready]);
  useEffect(() => { field.current?.setAttribute('aria-invalid', String(!!props.invalid || !!message)); }, [props.invalid, message, ready]);
  useEffect(() => { decoration.current?.update({ enabled: highlighting, activeParameter: props.activeParameter }); }, [highlighting, props.activeParameter, ready]);
  return <div className="zen-equation-input" data-ready={ready}>
    <div ref={host} hidden={plain} className="zen-equation-input__field" />
    {!ready && !failure && <span className="zen-equation-input__loading">Preparing equation editor…</span>}
    {plain && <input id={props.id} aria-label={props.label} value={props.value} aria-invalid={props.invalid} onFocus={props.onFocus} onChange={event => { emitted.current = event.target.value; props.onChange(event.target.value); try { field.current?.setValue(expressionLatex(event.target.value), { silenceNotifications: true }); setMessage(''); } catch { /* Preserve unfinished source. */ } }} spellCheck={false} autoCapitalize="off" />}
    <div className="zen-equation-input__tools">
      <button type="button" disabled={!ready} onClick={() => { if (plain) { try { field.current?.setValue(expressionLatex(props.value), { silenceNotifications: true }); setMessage(''); } catch { setMessage('Finish the plain-text expression before switching to typeset math.'); return; } } field.current?.blur(); setPlain(value => !value); }}>{plain ? 'Typeset' : 'Plain text'}</button>
      {!plain && ready && <button type="button" onPointerDown={event => event.preventDefault()} onClick={() => { if (document.activeElement === field.current) { window.mathVirtualKeyboard.visible ? window.mathVirtualKeyboard.hide() : window.mathVirtualKeyboard.show(); } else { keyboardRequested.current = true; field.current?.focus(); } }}>Math keyboard</button>}
      {!plain && ready && <button type="button" aria-label={`Syntax colors for ${props.label}`} aria-pressed={highlighting} onClick={() => setHighlighting(value => !value)}>Colors</button>}
    </div>
    {!plain && highlighting && (props.showColorKey ?? true) && <EquationColorKey />}
    {failure && <small>Equation editor unavailable. You can still type an expression.</small>}
    {message && <small className="zen-equation-input__error" role="status">{message}</small>}
  </div>;
}

/** Shared legend: color assists reading; labels retain the same meaning without color. */
export function EquationColorKey() {
  return <div className="zen-equation-input__color-key" aria-label="Equation color key"><span data-kind="function">Functions</span><span data-kind="parameter">Quantities</span><span data-kind="position">x · position</span><span data-kind="time">t · time</span><small>f, g, h match their curves. The active quantity is underlined.</small></div>;
}
