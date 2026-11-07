/**
 * OpenSpec: a root's specs and changes read from its files (`model/`, no React) and drawn
 * (`view/`). React-only; not yet exported from the package's public entries.
 */
export * from './model';
export { Markdown, Inlines, type MarkdownProps } from './view/Markdown/Markdown';
export { Spec, RequirementView, ScenarioView, Badge, type SpecProps, type DeltaKind } from './view/Spec/Spec';
export { Change, DeltaView, Tasks, Progress, type ChangeProps } from './view/Change/Change';
export { Repo, type RepoProps, type Open } from './view/Repo/Repo';
