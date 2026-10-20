// The chosen form, framework-free: what an assembled screen hands each region (its form and its
// parts' forms) and how a component picks its own form from it. React's `useForm` (forms.tsx) and
// Svelte's `getForm` (forms.svelte.ts) both call `pickForm`.
import type { Forms } from './types';

/** The form the solver chose for the region a component sits in, and its parts' forms. */
export interface FormContextValue {
  form: string;
  parts?: Readonly<Record<string, string>>;
}

/**
 * A component's form: `given` when set; else the chosen form (its `part`'s, when the region's form
 * names that part) if it is one of `forms`; else the component's first (richest) form.
 */
export function pickForm<Id extends string>(forms: Forms<Id>, chosen: FormContextValue | null | undefined, given?: Id, part?: string): Id {
  if (given !== undefined) return given;
  const id = part !== undefined && chosen?.parts?.[part] !== undefined ? chosen.parts[part] : chosen?.form;
  const hit = forms.find((f) => f.id === id);
  return hit ? hit.id : forms[0].id;
}

/** The chosen form as a store (`subscribe`/`get`), what a form scope hands the components inside:
 *  React's `useForm` reads it with `useSyncExternalStore`, Svelte's `getForm` with `fromStore`. */
export interface FormStore {
  /** Calls `listener` on every change (and once now, Svelte's store contract); returns the unsubscribe. */
  subscribe(listener: (value: FormContextValue | null) => void): () => void;
  get(): FormContextValue | null;
}

/** A form store that holds `value` (a scope makes a new one when its form changes). */
export function fixedForm(value: FormContextValue | null): FormStore {
  return {
    subscribe(listener) {
      listener(value);
      return () => {};
    },
    get: () => value,
  };
}

/** Outside any form scope: no chosen form. */
export const NO_FORM: FormStore = fixedForm(null);
