// The chosen form in Svelte: the twin of forms.tsx over the same `pickForm` (forms.model.ts).
// Each reader returns an object whose `current` getter is reactive (read it in markup, a
// `$derived` or an `$effect`); call them while a component initialises, as with any context.
//
//   const form = getForm(NOW_FORMS, () => props.form);   // form.current: 'full' | 'compact'
import { getContext, setContext } from 'svelte';
import { pickForm, type FormContextValue } from './forms.model';
import type { Forms } from './types';

const FORM = Symbol('zen.form');

/** Hands the chosen form (and its parts' forms) to every component inside; `get` is read on each use, so it stays current. `FormScope.svelte` calls it per slot. */
export function setFormContext(get: () => FormContextValue | null): void {
  setContext(FORM, get);
}

const chosen = (): (() => FormContextValue | null) | undefined => getContext<(() => FormContextValue | null) | undefined>(FORM);

/**
 * React's `useForm`: the form the assembled screen chose for this region (or `part`'s), if it is
 * one of `forms`, else the first. `given` (a getter, so a prop stays live) wins when it returns a form.
 */
export function getForm<Id extends string>(forms: Forms<Id>, given?: () => Id | undefined, part?: string): { readonly current: Id } {
  const get = chosen();
  return {
    get current() {
      return pickForm(forms, get?.(), given?.(), part);
    },
  };
}

/** React's `useChosenForm`: the chosen form's id, or `null` outside an assembled screen. */
export function getChosenForm(): { readonly current: string | null } {
  const get = chosen();
  return {
    get current() {
      return get?.()?.form ?? null;
    },
  };
}
