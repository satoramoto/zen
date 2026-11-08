import { useId, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { Button } from '../../../components/core/Button/Button';
import { Radio } from '../../../components/core/Radio/Radio';
import { focusRing } from '../../../primitives/Ring';
import { Stack } from '../../../primitives/Stack';
import { Surface } from '../../../primitives/Surface';
import { Text } from '../../../primitives/Text';
import type { Verdict } from '../../model/exercise';
import './Exercise.css';

export interface ExerciseProps {
  /** "Exercise 2". */
  number?: string;
  prompt: ReactNode;
  /** How it is answered: typed in a field (default), one of `choices`, or by a quantity the page reads at Check. */
  mode?: 'typed' | 'choice' | 'quantity';
  /** The options of a choice exercise. */
  choices?: { id: string; prompt: ReactNode }[];
  /** A quantity exercise's live reading, shown beside Check: "θ = 31°". */
  reading?: ReactNode;
  /** What the answer field suggests. */
  placeholder?: string;
  /** Checks an answer (the field's text, the chosen option's id, or nothing for a quantity); the page binds the block's checker and expectation. */
  check(given: string): Verdict;
  hint?: ReactNode;
  solution?: ReactNode;
  /** Already answered correctly (progress restored). */
  done?: boolean;
  /** Called with each verdict, so the page can keep progress. */
  onResult?(verdict: Verdict): void;
}

/**
 * **Job.** A question with one way to answer it: a field, a radio group of choices, or a
 * quantity the reader has set elsewhere (by scrubbing or dragging a figure) that the page reads
 * when Check is pressed. Check marks it right or wrong with the checker's feedback; a right
 * answer locks the answer and shows a tick. A hint and a solution are there on request, never
 * shown first. The verdict is announced for assistive technology.
 */
export function Exercise({ number, prompt, mode = 'typed', choices = [], reading, placeholder, check, hint, solution, done = false, onResult }: ExerciseProps) {
  const [given, setGiven] = useState('');
  const [verdict, setVerdict] = useState<Verdict | null>(done ? { correct: true } : null);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const id = useId();
  const correct = verdict?.correct ?? false;
  const submit = () => {
    if (correct) return;
    if (mode === 'choice' && !given) {
      const v = { correct: false, feedback: 'Choose an answer first.' };
      setVerdict(v);
      onResult?.(v);
      return;
    }
    const v = check(mode === 'quantity' ? '' : given);
    setVerdict(v);
    onResult?.(v);
  };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit();
  };
  const buttons = (
    <>
      <Button label="Check" variant={correct ? 'secondary' : 'primary'} disabled={correct} onPress={submit} />
      {hint && !correct && <Button label={showHint ? 'Hide hint' : 'Hint'} variant="secondary" onPress={() => setShowHint((h) => !h)} />}
      {solution && <Button label={showSolution ? 'Hide solution' : 'Solution'} variant="secondary" onPress={() => setShowSolution((s) => !s)} />}
    </>
  );
  return (
    <Surface as="section" layer="raised" className="cmp-exercise" aria-labelledby={`${id}-prompt`} data-state={verdict ? (correct ? 'correct' : 'wrong') : 'open'} data-mode={mode}>
      <Stack gap={3}>
        <Text as="p" role="body" id={`${id}-prompt`} className="cmp-exercise__prompt">
          {number && (
            <Text role="label" size="caption" tone="accent" className="cmp-exercise__number">
              {number}
            </Text>
          )}
          {prompt}
        </Text>
        <form onSubmit={onSubmit} className="cmp-exercise__form">
          {mode === 'choice' ? (
            <Stack gap={3}>
              <Stack as="div" gap={2} role="radiogroup" aria-labelledby={`${id}-prompt`} aria-describedby={verdict ? `${id}-verdict` : undefined} className="cmp-exercise__choices">
                {choices.map((c) => (
                  <Radio key={c.id} name={`${id}-choice`} value={c.id} checked={given === c.id} disabled={correct} onChange={(on) => on && setGiven(c.id)}>
                    <Text as="span" role="body" className="cmp-exercise__choice">
                      {c.prompt}
                    </Text>
                  </Radio>
                ))}
              </Stack>
              <Stack direction="row" gap={2} wrap align="center">
                {buttons}
              </Stack>
            </Stack>
          ) : (
            <Stack direction="row" gap={2} wrap align="center">
              {mode === 'quantity' ? (
                <Text as="output" role="numeral" size="body" tabular tone={correct ? 'success' : 'primary'} className="cmp-exercise__reading" aria-live="polite">
                  {reading}
                </Text>
              ) : (
                <Text
                  as="input"
                  role="body"
                  className={`cmp-exercise__input ${focusRing}`}
                  aria-label="Your answer"
                  aria-describedby={verdict ? `${id}-verdict` : undefined}
                  aria-invalid={verdict && !correct ? true : undefined}
                  placeholder={placeholder}
                  value={given}
                  readOnly={correct}
                  onChange={(e: ChangeEvent<HTMLElement>) => setGiven((e.target as HTMLInputElement).value)}
                  autoComplete="off"
                />
              )}
              {buttons}
            </Stack>
          )}
        </form>
        <Text as="p" role="caption" tone={correct ? 'success' : verdict ? 'danger' : 'muted'} id={`${id}-verdict`} aria-live="polite" className="cmp-exercise__verdict">
          {verdict ? (correct ? '✓ Correct.' : `✗ Not yet.${verdict.feedback ? ` ${verdict.feedback}` : ''}`) : ''}
        </Text>
        {showHint && hint && !correct && (
          <Text as="p" role="caption" tone="secondary" className="cmp-exercise__aside">
            <Text role="label" size="caption" tone="muted" className="cmp-exercise__tag">
              Hint
            </Text>
            {hint}
          </Text>
        )}
        {showSolution && solution && (
          <Text as="p" role="caption" tone="secondary" className="cmp-exercise__aside">
            <Text role="label" size="caption" tone="muted" className="cmp-exercise__tag">
              Solution
            </Text>
            {solution}
          </Text>
        )}
      </Stack>
    </Surface>
  );
}
