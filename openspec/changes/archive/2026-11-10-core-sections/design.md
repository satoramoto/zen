# Design

## Decisions

- **Components, not a `core/theme-editor` sub-area.** The picker, editor, settings section and
  scope are generic controls any app uses; `components/` is where those are. Four folders do not
  need their own group.
- **Skins in `foundation/skins/`.** The root has no `model/` tier, and skins are theme machinery
  with no renderer, like `foundation/themes/`.
- **A root `screens/` tier** rather than leaving the inspector and catalog in `foundation/`.
  They are whole views with stories; `foundation/` then means machinery only. `screens/` is not
  scanned by the tier rules, as `foundation/inspector` was not.
- **Record the editor's markup in `view.baseline.json`.** That file is the list of unconverted
  components. Leaving the editor out of the rule would need an exception by folder name.
