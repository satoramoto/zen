import { useId, type ReactNode } from 'react';
import { Stack } from '../../../primitives/Stack/Stack';
import { Surface } from '../../../primitives/Surface/Surface';
import { Text } from '../../../primitives/Text/Text';
import './Figure.css';

export interface FigureProps {
  /** "Figure 1". */
  number?: string;
  title: string;
  /** The live illustration. */
  children: ReactNode;
  /** The labelled control(s) that drive it; none when the illustration carries its own. */
  control?: ReactNode;
  /** One line: what the control changes in the illustration, for its current value; none when the illustration says so itself. */
  changes?: ReactNode;
  /** Where the model or data comes from. */
  source: ReactNode;
}

/**
 * **Job.** A live illustration in a card on the raised layer (its edge and shadow are the
 * pack's: an ink offset on the blueprint, a faint glow on the console), its stage a well, its
 * control(s) under the stage, and a ruled caption: the figure's number in the accent, its title,
 * what changes, and its source.
 */
export function Figure({ number, title, children, control, changes, source }: FigureProps) {
  const titleId = useId();
  return (
    <Surface as="figure" layer="raised" className="cmp-figure" aria-labelledby={titleId}>
      <Surface material="well" radius="input" className="cmp-figure__stage">
        {children}
      </Surface>
      <Stack gap={3} className="cmp-figure__below">
        {control && <div className="cmp-figure__control">{control}</div>}
        {changes && (
          <Text as="p" role="caption" tone="secondary" className="cmp-figure__changes" aria-live="polite">
            {changes}
          </Text>
        )}
        <Text as="figcaption" role="caption" tone="muted" className="cmp-figure__caption">
          {number && (
            <Text role="label" size="caption" tone="accent" className="cmp-figure__number">
              {number}
            </Text>
          )}
          <span className="cmp-figure__text">
            <Text role="caption" weight="strong" tone="primary" id={titleId}>
              {title}
            </Text>{' '}
            {source}
          </span>
        </Text>
      </Stack>
    </Surface>
  );
}
