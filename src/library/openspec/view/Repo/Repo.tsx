import { useState } from 'react';
import { focusRing } from '../../../primitives/Ring';
import { Stack } from '../../../primitives/Stack';
import { Surface } from '../../../primitives/Surface';
import { Text } from '../../../primitives/Text';
import { taskProgress } from '../../model/change';
import { summarize, type Repo as RepoData } from '../../model/repo';
import { scenarioCount } from '../../model/spec';
import { Change, Progress } from '../Change/Change';
import { Spec } from '../Spec/Spec';
import '../openspec.css';

/** What the repo view has open. */
export type Open = { kind: 'overview' } | { kind: 'spec'; capability: string } | { kind: 'change'; name: string; archived?: boolean };

export interface RepoProps {
  repo: RepoData;
  /** The root's name, for the header: a project, a store. */
  name?: string;
  initial?: Open;
  onOpen?(open: Open): void;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Surface layer="raised" className="os-stat">
      <Stack gap={1}>
        <Text role="numeral" size="heading" weight="numeral" tone="primary" tabular>
          {value}
        </Text>
        <Text role="label" size="caption" tone="muted">
          {label}
        </Text>
      </Stack>
    </Surface>
  );
}

/**
 * **Job.** An OpenSpec root at a glance and in full: the specs, active changes and archive
 * listed down the side with their counts and task progress; the overview (the numbers, the
 * changes under way) or the open spec or change beside them. Folds to one column when narrow.
 */
export function Repo({ repo, name = 'openspec', initial = { kind: 'overview' }, onOpen }: RepoProps) {
  const [open, setOpen] = useState<Open>(initial);
  const go = (o: Open) => {
    setOpen(o);
    onOpen?.(o);
  };
  const summary = summarize(repo);
  const exists = Object.fromEntries(repo.specs.map((s) => [s.capability, true]));
  const current = (o: Open) => JSON.stringify(o) === JSON.stringify(open);
  const item = (label: string, aside: string, o: Open) => (
    <li key={JSON.stringify(o)}>
      <Text as="button" type="button" role="body" size="caption" tone={current(o) ? 'primary' : 'secondary'} className={`os-repo__item ${focusRing}`} aria-current={current(o) ? 'true' : undefined} onClick={() => go(o)}>
        <span className="os-repo__name">{label}</span>
        <Text role="numeral" size="caption" tone="muted" tabular>
          {aside}
        </Text>
      </Text>
    </li>
  );
  return (
    <Surface layer="base" radius="none" className="os-repo" data-root={name}>
      <div className="os-repo__grid">
        <Surface as="nav" layer="ground" radius="none" className="os-repo__side" aria-label="OpenSpec contents">
          <Stack gap={4}>
            <Stack gap={1}>
              <Text role="label" tone="muted">
                OpenSpec{repo.schema ? ` · ${repo.schema}` : ''}
              </Text>
              <Text as="button" type="button" role="heading" size="body" weight="strong" tone="primary" className={`os-repo__item ${focusRing}`} aria-current={current({ kind: 'overview' }) ? 'true' : undefined} onClick={() => go({ kind: 'overview' })}>
                <span className="os-repo__name">{name}</span>
              </Text>
            </Stack>
            <Stack gap={1}>
              <Text role="label" size="caption" tone="muted">
                Specs · {repo.specs.length}
              </Text>
              <ul className="os-repo__list" aria-label="Specs">
                {repo.specs.map((s) => item(s.capability, `${s.requirements.length}·${scenarioCount(s)}`, { kind: 'spec', capability: s.capability }))}
              </ul>
            </Stack>
            <Stack gap={1}>
              <Text role="label" size="caption" tone="muted">
                Changes · {repo.changes.length}
              </Text>
              <ul className="os-repo__list" aria-label="Changes">
                {repo.changes.map((c) => {
                  const p = taskProgress(c);
                  return item(c.title, p.total ? `${p.done}/${p.total}` : '', { kind: 'change', name: c.name });
                })}
              </ul>
            </Stack>
            {repo.archive.length > 0 && (
              <Stack gap={1}>
                <Text role="label" size="caption" tone="muted">
                  Archive · {repo.archive.length}
                </Text>
                <ul className="os-repo__list" aria-label="Archive">
                  {repo.archive.map((c) => item(c.title, c.archived?.date ?? '', { kind: 'change', name: c.name, archived: true }))}
                </ul>
              </Stack>
            )}
          </Stack>
        </Surface>
        <main className="os-repo__main">
          {open.kind === 'overview' && (
            <Stack gap={5} className="os-doc">
              <Stack gap={2}>
                <Text role="label" tone="muted">
                  Overview
                </Text>
                <Text as="h1" role="display" size="heading" weight="display" tone="primary">
                  {name}
                </Text>
              </Stack>
              <div className="os-stats">
                <Stat label="specs" value={summary.specs} />
                <Stat label="requirements" value={summary.requirements} />
                <Stat label="scenarios" value={summary.scenarios} />
                <Stat label="active changes" value={summary.changes} />
                <Stat label="archived" value={summary.archived} />
              </div>
              {repo.changes.length > 0 && (
                <Stack gap={3}>
                  <Text as="h2" role="heading" tone="primary" className="os-doc__h">
                    Under way
                  </Text>
                  {repo.changes.map((c) => {
                    const p = taskProgress(c);
                    return (
                      <Surface key={c.name} layer="raised" className="os-requirement">
                        <Stack gap={2}>
                          <Text as="button" type="button" role="heading" size="body" weight="strong" tone="primary" className={`os-repo__item ${focusRing}`} onClick={() => go({ kind: 'change', name: c.name })}>
                            <span className="os-repo__name">{c.title}</span>
                          </Text>
                          <Text role="caption" tone="muted">
                            {c.deltas.length ? `touches ${c.deltas.map((d) => d.capability).join(', ')}` : c.skipSpecs ? 'skips specs' : 'no deltas yet'}
                          </Text>
                          {p.total > 0 && <Progress done={p.done} total={p.total} />}
                        </Stack>
                      </Surface>
                    );
                  })}
                </Stack>
              )}
              {repo.specs.length === 0 && repo.changes.length === 0 && (
                <Text role="body" tone="muted">
                  Nothing here yet: no specs and no changes.
                </Text>
              )}
            </Stack>
          )}
          {open.kind === 'spec' && (() => {
            const spec = repo.specs.find((s) => s.capability === open.capability);
            return spec ? <Spec spec={spec} /> : <Text role="body" tone="muted">No spec “{open.capability}”.</Text>;
          })()}
          {open.kind === 'change' && (() => {
            const change = (open.archived ? repo.archive : repo.changes).find((c) => c.name === open.name);
            return change ? <Change change={change} exists={exists} /> : <Text role="body" tone="muted">No change “{open.name}”.</Text>;
          })()}
        </main>
      </div>
    </Surface>
  );
}
