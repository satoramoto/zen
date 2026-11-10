// Self-assembling layout (docs/assembly.md): components declare forms, screens declare intent,
// `assemble()` places them under the system's principles.
export type { Units, Length, Need, Form, Forms, Ratio, RegionSpec, Nest, Row, ScreenSpec, Aspect, AspectFit, Box, Principles, Rect, Placed, Placement } from './types';
export { assemble, fitAspect, DENSITY_AIM } from './assemble';
export { principlesFor, resolveLength, resolveNeed, stepPx, cssPx, cssBox, rankNumbers, lengthSum, lengthMax, needsAcross, needsDown, combineForms, ROLE_LEADING, CHAR_WIDTH } from './units';
export { FormProvider, useForm, useChosenForm, type Formed } from './forms';
export { AssembledScreen, useScopePrinciples, SLOT_VARS, type AssembledScreenProps, type RegionContent } from './AssembledScreen';
// The framework-free halves the React hooks and the Svelte runes share.
export { pickForm, type FormContextValue } from './forms.model';
export { scopePrinciples, type PrinciplesScope } from './principles';
export { observeRoom, FALLBACK_ROOM, type RoomSize } from './room';
export { assembledView, slotView, atDecls, type AssembledView, type SlotView, type ZoneView } from './AssembledScreen.model';
