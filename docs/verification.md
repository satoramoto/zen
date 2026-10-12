# Verification

## Automated checks

Integrator ran the following on merge `877024f352a581ac69a85d7c3906094f59777d9e`:

- TypeScript typecheck: passed.
- Vitest: 46 tests passed.
- Vite production build: passed.
- Storybook production build: passed, with non-fatal Node deprecation and bundle-size warnings.

The subsequent prose-only T3 caption correction, source `3475ab675de594b07c2233d4827c9550bd1b9466`, was integrated as `c5dc3f736b0b3a2e512ece4e3fc88b13e276798b`. Diff checks passed; automated builds/tests were not repeated for that caption-only change.

## Independent review

Both independent reference/source reviewers approve all eighteen examples at source `3475ab675de594b07c2233d4827c9550bd1b9466`, with no unresolved actionable source findings. See [review A](jsx-review-a.md) and [review B](jsx-review-b.md). References vary from publisher topic summaries to public author chapters; this is not a claim of full-book textual fidelity.

## Integrated browser checks

The coordinator supplied the following completed runtime evidence on the integrated preview:

- All eighteen app controls exercised: fourteen checkbox comparisons, measure and width keyboard endpoints, hue keyboard adjustment, and voice selection.
- All eighteen individual Storybook stories rendered.
- Storybook manager's T1 applied control changed the title from 36 px to 15 px.
- At 320 px and 736 px iframe outer widths, scrollbar-adjusted content widths were 303 px and 719 px; all six chapters had no horizontal document overflow.
- W3's narrow specimen changed from actual 160 px to 245 px, capped by available width.
- T2 minimum and maximum measure states remained contained.

Browser evidence was performed and reported by the coordinator, separately from source review and automated tests. These checks do not constitute a complete accessibility audit.
