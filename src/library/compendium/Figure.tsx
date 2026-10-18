import { useId, type ReactNode } from 'react';
import { Stack } from '../primitives/Stack';
import { Surface } from '../primitives/Surface';
import { Text } from '../primitives/Text';
import './Figure.css';

export interface FigureProps {
  /** "Figure 1". */
  number?: string;
  title: string;
  /** The live illustration. */
  children: ReactNode;
  /** The labelled control(s) that drive it. */
  control: ReactNode;
  /** One line: what the control changes in the illustration, for its current value. */
  changes: ReactNode;
  /** Where the model or data comes from. */
  source: ReactNode;
}

/**
 * **Job.** (Compendium mockup stub.) A live illustration with its control, a "what changes" line
 * and a source: the field guide card's pattern (`src/PrincipleExample.tsx`: brief, toolbar,
 * stage, teaching notes, reference) built from the primitives. The card is a raised `Surface`;
 * the stage a `well`, so the illustration reads as a screen set into it.
 */
export function Figure({ number, title, children, control, changes, source }: FigureProps) {
  const titleId = useId();
  return (
    <Surface as="figure" layer="raised" className="cmp-figure" aria-labelledby={titleId}>
      <Stack gap={3}>
        <Stack gap={1}>
          {number && (
            <Text role="label" tone="muted">
              {number}
            </Text>
          )}
          <Text role="heading" size="body" weight="strong" tone="primary" id={titleId}>
            {title}
          </Text>
        </Stack>
        <Surface material="well" radius="input" className="cmp-figure__stage">
          {children}
        </Surface>
        <div className="cmp-figure__control">{control}</div>
        <Text as="p" role="caption" tone="secondary" className="cmp-figure__changes" aria-live="polite">
          <Text role="label" size="caption" tone="muted" className="cmp-figure__tag">
            What changes
          </Text>
          {changes}
        </Text>
        <Text as="figcaption" role="caption" tone="muted">
          <Text role="label" size="caption" tone="muted" className="cmp-figure__tag">
            Source
          </Text>
          {source}
        </Text>
      </Stack>
    </Surface>
  );
}
