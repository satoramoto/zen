/** The editor's lifecycle. The model owns every element; this store only manages events/focus. */
export interface NumberFieldEditorParams {
  onDraft?(text: string): void;
  onCommit?(text: string): void;
  onCancel?(): void;
}
export function bindNumberFieldEditor(input: HTMLElement, initial: NumberFieldEditorParams) {
  const node = input as HTMLInputElement;
  let params = initial;
  let closed = false;
  const onInput = () => params.onDraft?.(node.value);
  function onBlur() { if (!closed) { closed = true; params.onCommit?.(node.value); } }
  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Enter' && e.key !== 'Escape') return;
    e.preventDefault();
    e.stopPropagation();
    if (closed) return;
    closed = true;
    if (e.key === 'Enter') params.onCommit?.(node.value); else params.onCancel?.();
  }
  node.addEventListener('input', onInput);
  node.addEventListener('blur', onBlur);
  node.addEventListener('keydown', onKeyDown);
  node.focus();
  return {
    update(next: NumberFieldEditorParams) { params = next; },
    destroy() { closed = true; node.removeEventListener('input', onInput); node.removeEventListener('blur', onBlur); node.removeEventListener('keydown', onKeyDown); },
  };
}
