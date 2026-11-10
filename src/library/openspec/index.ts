/**
 * OpenSpec: a root's specs and changes read from its files (`model/`, no React) and drawn
 * (`view/`). React-only; not yet exported from the package's public entries.
 */
export * from './model';
export { Markdown, Inlines, type MarkdownProps } from './components/Markdown/Markdown';
export { Spec, RequirementView, ScenarioView, Badge, type SpecProps, type DeltaKind } from './components/Spec/Spec';
export { Change, DeltaView, Tasks, Progress, type ChangeProps } from './components/Change/Change';
export { Repo, type RepoProps, type Open } from './components/Repo/Repo';
