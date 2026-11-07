# Editable wave calculator

**Math / Wave Calculator** is the first authorable workspace on the React math framework.
Open `?path=/story/math-wave-calculator--playground` in the unified Storybook preview.

Three editable definitions, `f(x)`, `g(x)`, and `h(x)`, share a position, a clock and named
parameters. The initial result is `f(x)+g(x)`, but all three definitions can change. For
example, `g(x)=-f(x)` cancels any edited `f`, while `g(x)=f(2*x)/2` composes it at another
scale. A new single-letter parameter creates a scrubbable quantity; drag sideways or
use arrow keys (Shift for larger steps). Probe movement compares all three values at one x.

Starting relationships cover interference, standing waves, exact cancellation, beating,
and function composition. The standing-wave pair has equal amplitudes and spatial
frequencies with opposite time signs. The beating pair uses nearby angular frequencies
and wavenumbers with equal phase speed. Time is a dimensionless parameter, not audio
playback. Pin result keeps the compiled expression, parameters and clock as an immutable
comparison. Loading a starting relationship resets the workspace and comparison.

## Expression model

`compileExpressions` is independent of React. It parses a deliberately small language
without `eval`, dynamic JavaScript functions, assignments, or object access. Supported
operations are `+ - * / ^`, parentheses, and unary signs. Powers associate rightward;
`-2^2` means `-(2^2)`. Multiplication must be explicit. The unary functions are sin, cos,
tan, abs, sqrt, exp, log (natural), floor and ceil. Constants are pi and e; angles are radians.

Each definition may call another with a different argument. Circular dependencies are
rejected before replacing the active program. Compilation is atomic across all three
expressions. Invalid drafts show an error and keep the last valid equations visible;
playback is disabled until corrected or restored. Numerical domain errors yield undefined
probe values and gaps, not zeroes.

Limits: three definitions, eight single-letter parameters in [−4, 4], 240 characters and
100 tokens per definition, and a 4096-node evaluation budget per sample. Values of newly
introduced parameters start at 1. Time runs from 0 to 20, starts only on explicit play,
and pauses offscreen or when the tab is hidden.

## Drawing and current scope

Mafs supplies coordinates and probe manipulation. The renderer samples each function at
641 positions in [−2π, 2π], with midpoint checks. Nonfinite or out-of-range values (|y| > 12),
large jumps and unresolved curvature break the path. Fit height fits the retained samples.
This is a bounded exploratory renderer, not an adaptive plotting guarantee: very steep
continuous segments, narrow features and high-frequency oscillations can be omitted or
aliased. It does not find roots or certify discontinuities.

This first workspace is 2D and session-local. It has no arbitrary expression list, implicit
curves, user-controlled domain, saved documents, symbolic algebra, or 3D expression adapter
yet. The compiler and sampler are exported alongside `WaveCalculator` from the public React
entry; existing MathBox scenes remain available separately.

## Verification

`expression.test.ts` checks precedence, function composition, shared quantities, rejected
syntax and cycles, evaluation limits, numerical domains and sampled discontinuities.
Story plays cover dependent edits, automatic parameter discovery, keyboard manipulation,
invalid drafts, circular references, comparison, playback and reset. Run
`node scripts/calculator-stories.mjs` against the unified launcher (default port 6027,
or `MATH_PREVIEW_URL`) for those plays plus pointer scrubbing, curve colors, domain errors,
and desktop/narrow screenshots. Run the normal typecheck, library tests, Storybook build,
package build and package boundary check when changing exported behavior.
