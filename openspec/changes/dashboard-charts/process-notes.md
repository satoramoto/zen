# Process notes

- Ruling: StatusDot's good/close/short/none/bad tones, link Tabs with counts, Chip, the log Slider, Tooltip and the scatter are left for later — StatusDot is Yahaha's today and each is its own change; Market's Design agreed — cost if wrong: Market keeps its own for those a while longer.
- Ruling: the static form's rule ("the server's markup draws the same DOM as the part") is held by `ruby src/rails/static_test.rb` in CI rather than a story, so story-spec sync leaves it out of the delta — no story can run Ruby — cost if wrong: only where the rule is written.
- Ruling: Track's `short` tone is quiet grey with a hollow dot, never red — Market keeps red for negative numbers and failures — cost if wrong: one CSS rule.
- Ruling: the chart's own TradingView attribution logo stays on, the library's default — its licence notice asks for attribution — cost if wrong: an option to turn off with a credit elsewhere.
- Ruling: candlesticks and volume are left out of v1 — Market has no OHLC and its volume is a rolling figure (Design's answer) — cost if wrong: two series kinds to add.
