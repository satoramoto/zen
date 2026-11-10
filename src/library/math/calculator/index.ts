/** React-only editable function workspace with linked curves and automatically discovered parameters. */
export { WaveCalculator, calculatorPresets, type WaveCalculatorProps } from './components/WaveCalculator/WaveCalculator';
/** Bounded expression compiler and curve sampling for caller-owned math workspaces. */
export { compileExpressions, sampleCurve, ExpressionError, type Equations, type ExpressionProgram, type FunctionName } from './expression';
/** Typeset equation input with touch keyboard, source fallback and bounded expression conversion. */
export { EquationInput, type EquationInputProps } from './components/EquationInput/EquationInput';
/** An exercise checker: the reader's expression equal to the expected one at a point or across a range, common spellings folded. */
export { expressionChecker, foldSpelling, type ExpressionOptions, type ExpressionVerdict } from './checker';
