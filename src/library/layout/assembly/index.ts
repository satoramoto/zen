// Self-assembling layout (docs/assembly.md): components declare forms, screens declare intent,
// `assemble()` places them under the system's principles.
export type { Units, Length, Need, Form, Forms, Ratio, RegionSpec, Nest, Row, ScreenSpec, Box, Principles, Rect, Placed, Placement } from './types';
export { assemble, DENSITY_AIM } from './assemble';
export { principlesFor, resolveLength, resolveNeed, stepPx, cssPx, cssBox, rankNumbers, lengthSum, lengthMax, needsAcross, needsDown, combineForms, ROLE_LEADING, CHAR_WIDTH } from './units';
export { FormProvider, useForm, useChosenForm, type Formed } from './forms';
export { AssembledScreen, useScopePrinciples, type AssembledScreenProps, type RegionContent } from './AssembledScreen';
