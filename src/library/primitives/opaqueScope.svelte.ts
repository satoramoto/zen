// The Svelte twin of React's `OpaqueContext` (Surface.tsx): `Opaque.svelte` sets it, and a
// `Surface.svelte` inside draws no shader material (nothing translucent over a native view).
// (Not `opaque.svelte.ts`: on a case-insensitive disk TypeScript resolves `./Opaque.svelte` to it.)
import { getContext, setContext } from 'svelte';

const OPAQUE = Symbol('zen.opaque');

/** Marks the components inside as in an `Opaque` scope (`Opaque.svelte` calls it). */
export const setOpaque = (): boolean => setContext(OPAQUE, true);

/** True inside an `Opaque` scope. */
export const insideOpaque = (): boolean => getContext<boolean | undefined>(OPAQUE) ?? false;
