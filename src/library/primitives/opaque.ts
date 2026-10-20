// The Opaque scope as a React context: true inside an `Opaque`, where no `Surface` draws a shader
// (nothing translucent over a native view). A tree provides it through the registered `Context`
// component (`view/Context.tsx`, name `opaque`); `Surface.tsx` reads it.
import { createContext } from 'react';

export const OpaqueContext = createContext(false);
