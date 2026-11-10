import { Stack } from '../../../primitives/Stack/Stack';
import { Surface } from '../../../primitives/Surface/Surface';
import { Text, type TextTone } from '../../../primitives/Text/Text';
import type { Requirement, Scenario, Spec as SpecData, StepKeyword } from '../../model/spec';
import { Markdown } from '../Markdown/Markdown';
import '../openspec.css';

const KEYWORD_TONE: Record<StepKeyword, TextTone> = { GIVEN: 'muted', WHEN: 1, THEN: 2, AND: 'secondary' };

/** A short word in a pill. */
export function Badge({ children, tone = 'secondary', fill = false }: { children: string; tone?: TextTone; fill?: boolean }) {
  return (
    <Text role="label" size="caption" tone={tone} className="os-badge" data-fill={fill ? '' : undefined}>
      {children}
    </Text>
  );
}

/** A scenario: its name and its Given/When/Then steps, keyword beside text. */
export function ScenarioView({ scenario }: { scenario: Scenario }) {
  return (
    <Surface material="well" radius="input" className="os-scenario" aria-label={`Scenario: ${scenario.name}`}>
      <Stack gap={2}>
        <Text role="heading" size="body" weight="strong" tone="primary">
          {scenario.name}
        </Text>
        <ol className="os-steps">
          {scenario.steps.map((s, i) => (
            <li key={i} style={{ display: 'contents' }}>
              <Badge tone={KEYWORD_TONE[s.keyword]} fill>
                {s.keyword}
              </Badge>
              <Text role="body" tone="primary">
                {s.text}
              </Text>
            </li>
          ))}
        </ol>
      </Stack>
    </Surface>
  );
}

export type DeltaKind = 'added' | 'modified' | 'removed';

/** A requirement: its name, its statement and its scenarios; in a delta, which kind it is. */
export function RequirementView({ requirement, delta }: { requirement: Requirement; delta?: DeltaKind }) {
  return (
    <Surface as="section" layer="raised" className="os-requirement" data-delta={delta} aria-label={`Requirement: ${requirement.name}`}>
      <Stack gap={3}>
        <Stack direction="row" gap={2} align="baseline" wrap>
          {delta && (
            <Badge tone={delta === 'added' ? 'success' : delta === 'modified' ? 'warning' : 'danger'} fill>
              {delta.toUpperCase()}
            </Badge>
          )}
          <Text role="heading" size="body" weight="strong" tone="primary">
            {requirement.name}
          </Text>
        </Stack>
        {requirement.text.length > 0 && <Markdown blocks={requirement.text} demote={2} />}
        {requirement.scenarios.map((s, i) => (
          <ScenarioView key={i} scenario={s} />
        ))}
      </Stack>
    </Surface>
  );
}

export interface SpecProps {
  spec: SpecData;
}

/**
 * **Job.** A capability's spec as a document: the capability, its purpose, then each
 * requirement as a card with its statement and scenarios. The SHALLs are the reader's to find;
 * the structure is drawn, never rewritten.
 */
export function Spec({ spec }: SpecProps) {
  return (
    <Stack as="article" gap={5} className="os-doc" data-capability={spec.capability}>
      <Stack gap={2}>
        <Text role="label" tone="muted">
          Spec · {spec.capability}
        </Text>
        <Text as="h1" role="display" size="heading" weight="display" tone="primary">
          {spec.title}
        </Text>
        <Text role="caption" tone="muted">
          {spec.requirements.length} requirement{spec.requirements.length === 1 ? '' : 's'} · {spec.requirements.reduce((n, r) => n + r.scenarios.length, 0)} scenarios
        </Text>
      </Stack>
      {spec.purpose.length > 0 && (
        <Stack gap={2}>
          <Text as="h2" role="heading" tone="primary" className="os-doc__h">
            Purpose
          </Text>
          <Markdown blocks={spec.purpose} />
        </Stack>
      )}
      <Stack gap={3}>
        <Text as="h2" role="heading" tone="primary" className="os-doc__h">
          Requirements
        </Text>
        {spec.requirements.map((r, i) => (
          <RequirementView key={i} requirement={r} />
        ))}
        {spec.requirements.length === 0 && (
          <Text role="body" tone="muted">
            No requirements yet.
          </Text>
        )}
      </Stack>
    </Stack>
  );
}
