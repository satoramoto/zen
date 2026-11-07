import { Stack } from '../../../primitives/Stack';
import { Surface } from '../../../primitives/Surface';
import { Text } from '../../../primitives/Text';
import { taskProgress, type Change as ChangeData, type TaskGroup } from '../../model/change';
import type { Delta } from '../../model/spec';
import { Markdown } from '../Markdown/Markdown';
import { Badge, RequirementView } from '../Spec/Spec';
import '../openspec.css';

/** Done out of total, as a bar. */
export function Progress({ done, total, label }: { done: number; total: number; label?: string }) {
  const pct = total ? Math.round((100 * done) / total) : 0;
  return (
    <Stack gap={1}>
      <Stack direction="row" gap={2} justify="between" align="baseline">
        <Text role="caption" tone="secondary">
          {label ?? 'Tasks'}
        </Text>
        <Text role="numeral" size="caption" tone={done === total && total > 0 ? 'success' : 'muted'} tabular>
          {done}/{total}
        </Text>
      </Stack>
      <div className="os-progress" role="progressbar" aria-label={label ?? 'Tasks done'} aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} data-done={done === total && total > 0 ? '' : undefined}>
        <div className="os-progress__fill" style={{ inlineSize: `${pct}%` }} />
      </div>
    </Stack>
  );
}

/** The task groups as a checklist. */
export function Tasks({ groups }: { groups: TaskGroup[] }) {
  return (
    <Stack gap={3}>
      {groups.map((g, i) => (
        <Stack key={i} gap={1}>
          <Text role="label" tone="muted">
            {g.name}
          </Text>
          <ul className="os-tasks">
            {g.tasks.map((t, j) => (
              <li key={j} className="os-task" data-done={t.done ? '' : undefined}>
                <span className="os-task__box" role="checkbox" aria-checked={t.done} aria-readonly="true" aria-label={t.text}>
                  {t.done && (
                    <svg viewBox="0 0 10 10" className="os-task__tick" aria-hidden="true">
                      <path d="M2 5.2 L4.2 7.4 L8 3" />
                    </svg>
                  )}
                </span>
                <Text role="numeral" size="caption" tone="muted" tabular>
                  {t.id ?? ''}
                </Text>
                <Text role="body" tone={t.done ? 'secondary' : 'primary'}>
                  {t.text}
                </Text>
              </li>
            ))}
          </ul>
        </Stack>
      ))}
    </Stack>
  );
}

/** One capability's delta: what the change adds, modifies, removes and renames. */
export function DeltaView({ delta, exists }: { delta: Delta; exists?: boolean }) {
  const count = delta.added.length + delta.modified.length + delta.removed.length + delta.renamed.length;
  return (
    <Stack as="section" gap={3} aria-label={`Delta: ${delta.capability}`}>
      <Stack direction="row" gap={2} align="baseline" wrap>
        <Text role="heading" size="body" weight="strong" tone="primary">
          {delta.capability}
        </Text>
        {exists === false && <Badge tone="success">new capability</Badge>}
        <Text role="caption" tone="muted">
          {count} change{count === 1 ? '' : 's'}
        </Text>
      </Stack>
      {delta.purpose && <Markdown blocks={delta.purpose} demote={2} />}
      {delta.renamed.map((r, i) => (
        <Surface key={`r${i}`} layer="raised" className="os-requirement">
          <Stack direction="row" gap={2} align="baseline" wrap>
            <Badge tone="warning" fill>
              RENAMED
            </Badge>
            <Text role="body" tone="secondary">
              {r.from}
            </Text>
            <Text role="body" tone="muted">
              →
            </Text>
            <Text role="body" tone="primary">
              {r.to}
            </Text>
          </Stack>
        </Surface>
      ))}
      {delta.added.map((r, i) => (
        <RequirementView key={`a${i}`} requirement={r} delta="added" />
      ))}
      {delta.modified.map((r, i) => (
        <RequirementView key={`m${i}`} requirement={r} delta="modified" />
      ))}
      {delta.removed.map((r, i) => (
        <RequirementView key={`d${i}`} requirement={r} delta="removed" />
      ))}
    </Stack>
  );
}

export interface ChangeProps {
  change: ChangeData;
  /** Which capabilities have a main spec (from the repo): a capability missing from the map is new. Omit it when unknown. */
  exists?: Record<string, boolean>;
}

/**
 * **Job.** A change as a document: its title and status (active or archived, tasks done), the
 * proposal, the spec deltas it carries per capability, the tasks as a checklist, and the design
 * when there is one. A tooling change that skips specs says so in place of deltas.
 */
export function Change({ change, exists }: ChangeProps) {
  const progress = taskProgress(change);
  return (
    <Stack as="article" gap={5} className="os-doc" data-change={change.name}>
      <Stack gap={2}>
        <Stack direction="row" gap={2} align="baseline" wrap>
          <Text role="label" tone="muted">
            Change · {change.name}
          </Text>
          {change.archived ? <Badge tone="muted">{`archived${change.archived.date ? ` ${change.archived.date}` : ''}`}</Badge> : <Badge tone="accent">active</Badge>}
          {change.skipSpecs && <Badge tone="muted">skips specs</Badge>}
        </Stack>
        <Text as="h1" role="display" size="heading" weight="display" tone="primary">
          {change.title}
        </Text>
        {progress.total > 0 && <Progress done={progress.done} total={progress.total} />}
      </Stack>
      <Stack gap={2}>
        <Text as="h2" role="heading" tone="primary" className="os-doc__h">
          Proposal
        </Text>
        <Markdown blocks={change.proposal.filter((b) => !(b.kind === 'heading' && b.level === 1))} />
      </Stack>
      <Stack gap={3}>
        <Text as="h2" role="heading" tone="primary" className="os-doc__h">
          Specs
        </Text>
        {change.deltas.map((d, i) => (
          <DeltaView key={i} delta={d} exists={exists ? (exists[d.capability] ?? false) : undefined} />
        ))}
        {change.deltas.length === 0 && (
          <Text role="body" tone="muted">
            {change.skipSpecs ? 'This change skips specs: nothing the system does changes.' : 'No spec deltas yet.'}
          </Text>
        )}
      </Stack>
      {change.tasks.length > 0 && (
        <Stack gap={3}>
          <Text as="h2" role="heading" tone="primary" className="os-doc__h">
            Tasks
          </Text>
          <Tasks groups={change.tasks} />
        </Stack>
      )}
      {change.design && (
        <Stack gap={2}>
          <Text as="h2" role="heading" tone="primary" className="os-doc__h">
            Design
          </Text>
          <Markdown blocks={change.design.filter((b) => !(b.kind === 'heading' && b.level === 1))} />
        </Stack>
      )}
    </Stack>
  );
}
