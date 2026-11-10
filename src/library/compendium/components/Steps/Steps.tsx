import { useState, type ReactNode } from 'react';
import { Button } from '../../../components/Button/Button';
import { Stack } from '../../../primitives/Stack/Stack';
import { Surface } from '../../../primitives/Surface/Surface';
import { Text } from '../../../primitives/Text/Text';
import './Steps.css';

export interface StepsProps {
  title?: string;
  /** Each step, drawn; a paragraph of runs in a page. */
  steps: ReactNode[];
  /** How many steps show at first. Default 1. */
  initial?: number;
}

/**
 * **Job.** An argument the reader walks through one step at a time: the first step shows, "Next
 * step" reveals the next, "Show all" the rest, and the steps already shown stay. The count is
 * announced, so a reader who can't see the reveal still knows where they are.
 */
export function Steps({ title, steps, initial = 1 }: StepsProps) {
  const [shown, setShown] = useState(Math.min(Math.max(1, initial), steps.length));
  const done = shown >= steps.length;
  return (
    <Surface as="section" layer="raised" className="cmp-steps" aria-label={title ?? 'Steps'}>
      <Stack gap={3}>
        <Stack direction="row" gap={2} align="baseline" justify="between">
          {title && (
            <Text role="heading" size="body" weight="strong" tone="primary">
              {title}
            </Text>
          )}
          <Text role="label" size="caption" tone="muted" aria-live="polite" className="cmp-steps__count">
            Step {shown} of {steps.length}
          </Text>
        </Stack>
        <Stack as="ol" gap={3} className="cmp-steps__list">
          {steps.slice(0, shown).map((step, i) => (
            <Stack as="li" key={i} direction="row" gap={3} className="cmp-steps__step" data-latest={i === shown - 1 ? '' : undefined}>
              <Text role="numeral" size="caption" tone="muted" tabular className="cmp-steps__number" aria-hidden="true">
                {i + 1}
              </Text>
              <Text as="div" role="body" className="cmp-steps__body">
                {step}
              </Text>
            </Stack>
          ))}
        </Stack>
        {!done && (
          <Stack direction="row" gap={2} wrap>
            <Button label="Next step" onPress={() => setShown((s) => Math.min(steps.length, s + 1))} />
            <Button label="Show all" variant="secondary" onPress={() => setShown(steps.length)} />
          </Stack>
        )}
      </Stack>
    </Surface>
  );
}
