/** React-only editable function workspace with linked curves and automatically discovered parameters. */
export { WaveCalculator, calculatorPresets, type WaveCalculatorProps } from './WaveCalculator';
/** Bounded expression compiler and curve sampling for caller-owned math workspaces. */
export { compileExpressions, sampleCurve, ExpressionError, type Equations, type ExpressionProgram, type FunctionName } from './expression';
/** Typeset equation input with touch keyboard, source fallback and bounded expression conversion. */
export { EquationInput, type EquationInputProps } from './EquationInput';
