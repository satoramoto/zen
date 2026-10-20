import { createContext, useContext, type ReactNode } from 'react';
import { pickForm, type FormContextValue } from './forms.model';
import type { Forms } from './types';

// Picking a form is framework-free (forms.model.ts); this binds it to a React context.
export { pickForm, type FormContextValue } from './forms.model';

/** The form the solver chose for the region a component sits in, and its parts' forms. */
const FormContext = createContext<FormContextValue | null>(null);

/** Hands `form` (and each part's form) to every component inside (the assembled Screen wraps each region in one). */
export function FormProvider({ form, parts, children }: { form: string; parts?: Readonly<Record<string, string>>; children?: ReactNode }) {
  return <FormContext.Provider value={{ form, parts }}>{children}</FormContext.Provider>;
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
 *
 * In a region whose forms name their parts (`Form.parts`), a part passes its name: `useForm(
 * TRANSPORT_FORMS, given, 'transport')` reads `parts.transport`.
 */
export function useForm<Id extends string>(forms: Forms<Id>, given?: Id, part?: string): Id {
  return pickForm(forms, useContext(FormContext), given, part);
}

/** The chosen form's id as it stands, or `null` outside an assembled screen. */
export function useChosenForm(): string | null {
  return useContext(FormContext)?.form ?? null;
}

/** A component that declares its forms: a static `forms` and a `form` prop. */
export type Formed<P, Id extends string> = ((props: P & { form?: Id }) => ReactNode) & { forms: Forms<Id> };
