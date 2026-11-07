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

## Typeset input and guided actions

Equations now use `EquationInput`, a React binding around MathLive, with proper fractions,
powers, roots and parentheses. Type `sin`, `pi`, `sqrt`, `/` or `^`, or open the themed
math keyboard (with an alphabetic layout for other letters). Touch focus opens it
automatically. Plain text remains available for source editing and as a load-failure
fallback. The editor and its bundled fonts load only when mounted; they require no
MathLive CDN and do not add font payload to the shared Zen stylesheet.

The MathLive buffer owns the caret, selection and undo history. Echoes from React never
rewrite that buffer. Incomplete fractions and unsupported notation leave the last valid
graph visible, with feedback beside the equation. Presets, restoring valid expressions,
and builder actions intentionally replace the edited expression.

“Shape f(x)” follows the focused equation. Sine wave replaces it with `a*sin(b*x-t)`;
Half as tall divides it by two; Flip over negates it; Combine waves sets `h(x)=f(x)+g(x)`.
Fade from center multiplies the selected function by `exp(-k*abs(x))`, choosing a fresh
parameter name and starting at 0.35. Positive values decay away from zero; zero removes
the envelope; negative values grow away from zero. These are explicit transformations,
not natural-language interpretation. Existing a and b quantities are shared when adding
the sine template.

Parameter chips beside every equation include its transitive dependencies. Selecting one
reveals a keyboard- and pointer-adjustable quantity beside that equation and dims curves
that do not depend on it. Known presets label height, frequency and phase; editing the
formula removes those semantic labels rather than guessing their meaning.

MathLive's LaTeX is parsed with Compute Engine in raw form, then translated through an
allowlist into Zen's existing bounded source interpreter. Compute Engine does not evaluate
or simplify it. Implicit multiplication is accepted in typeset mode. Printed `ln` is
natural logarithm and printed `log` is base ten; plain-text `log()` retains its original
natural-log meaning and typesets as ln. Unsupported operations (including integrals,
equalities, matrices and non-square roots) get explicit feedback. The previous expression,
parameter and evaluation budgets still apply; the typeset input is additionally limited
to 1200 LaTeX characters and a 150-node conversion budget.

`Math/Components/Equation Input` has wave, fraction, envelope and composition specimens.
`node scripts/equation-input-stories.mjs` checks physical typing, caret preservation,
undo/redo, incomplete fractions, domain errors, inline quantities, touch key insertion,
local editor assets and keyboard ownership inside Storybook's iframe. Pure bridge tests
check round-trip grouping, composed functions, logarithms and unsupported input.

## Syntax highlighting

Typeset input uses a small, theme-aware color vocabulary: functions use hue 4,
adjustable quantities hue 2, x/position hue 1, and t/time hue 3. References f, g and h
match their respective graph colors. Numbers, constants and operators stay quieter.
The color key explains the mapping; the per-editor Colors toggle restores monochrome.
Plain-text mode remains an ordinary source input.

Selecting a quantity highlights its occurrences across all equations with an underline
and background as well as color. The existing inline controls and curve highlighting
use that same selection. The `highlighting`, `activeParameter` and `showColorKey` props
are also available on the standalone `EquationInput`.

The isolated `highlighting.ts` adapter decorates visible MathLive glyph leaves in its
shadow DOM. It never applies formatting commands to the math model, changes LaTeX,
rewrites the input sink, or touches selection/undo. A mutation observer reapplies
presentation after MathLive redraws; attribute writes do not retrigger the observer.
This deliberately depends on the pinned MathLive 0.111.x rendered-token structure.
Run `node scripts/highlight-stories.mjs` when upgrading MathLive; it verifies token
classification, theme colors, active quantities, toggling, unmodified LaTeX and live
input. The existing equation-input runner covers caret, undo/redo and touch regressions.

## Select a part and preview a change

Select complete math in the typeset editor, or use **Explore parts** beside an equation.
The chips are parsed subexpressions, including individual quantities and nested function
arguments. Repeated selections offer explicit occurrences in equation order; the system
does not guess which identical term was intended.

Choose an action to preview it (keyboard focus also previews). The proposed equation is
typeset and linked curves are dashed. Existing equations, solid curves and probe values
remain unchanged until **Apply change**. **Done** cancels a preview. **Undo transformation**
restores the previous equations, with up to twenty action steps; manual edits and preset
changes clear this history so an old action cannot overwrite subsequent typing. Parameter
changes remain independent. On narrow screens, **View proposal on graph** and **Back to
selected part** connect the two views.

Transforms replace one AST subtree; horizontal transforms replace only `x` within it.
The existing expression, token and evaluation limits apply to proposals too. Invalid or
over-budget proposals cannot be applied. This is the discoverability and preview layer;
spatial drag-and-drop composition is not implemented yet.

Verify with `node scripts/term-stories.mjs` and the `Explore Parts` Storybook play, alongside
the existing calculator runner. `terms.test.ts` checks grouping, repeated occurrences,
composition, invalid paths and envelope symmetry.
