import { createContext, useContext, type ReactNode } from 'react';
import type { Forms } from './types';

/** The form the solver chose for the region a component sits in. */
const FormContext = createContext<string | null>(null);

/** Hands `form` to every component inside (the assembled Screen wraps each region in one). */
export function FormProvider({ form, children }: { form: string; children?: ReactNode }) {
  return <FormContext.Provider value={form}>{children}</FormContext.Provider>;
}

/**
 * The form the assembled screen chose for the region this component is in, if it is one of
 * `forms`; otherwise the component's first (richest) form. A component that declares its forms
 * reads its form here, or takes a `form` prop that wins over this:
 *
 * ```tsx
 * function Display({ form: given }: { form?: DisplayForm }) {
 *   const form = useForm(Display.forms, given);
 * }
 * Display.forms = DISPLAY_FORMS;
 * ```
 */
export function useForm<Id extends string>(forms: Forms<Id>, given?: Id): Id {
  const chosen = useContext(FormContext);
  if (given !== undefined) return given;
  const hit = forms.find((f) => f.id === chosen);
  return hit ? hit.id : forms[0].id;
}

/** The chosen form's id as it stands, or `null` outside an assembled screen. */
export function useChosenForm(): string | null {
  return useContext(FormContext);
}

/** A component that declares its forms: a static `forms` and a `form` prop. */
export type Formed<P, Id extends string> = ((props: P & { form?: Id }) => ReactNode) & { forms: Forms<Id> };
