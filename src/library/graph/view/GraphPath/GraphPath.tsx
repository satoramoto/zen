import type { ReactNode } from 'react';
import { Icon } from '../../../primitives/Icon';
import { focusRing } from '../../../primitives/Ring';
import { Text } from '../../../primitives/Text';
import './GraphPath.css';

export interface GraphPathStep {
  /** The host's id for this level (a module id, an instance id). */
  id: string;
  /** What the level is called: the board, or the instance entered. */
  label: string;
  /** A quieter word after the label: what it is an instance of. */
  kicker?: string;
}

export interface GraphPathProps {
  /** Outermost first; the last is where the view is. */
  steps: readonly GraphPathStep[];
  /** A step before the last was chosen: go back out to it. */
  onNavigate(index: number): void;
  /** The trail's accessible name. Default `Module path`. */
  label?: string;
  /** Host chrome after the trail (a leave button). */
  end?: ReactNode;
  className?: string;
}

/**
 * **Job.** Where a graph view is among nested modules: the board, then each instance entered, as
 * a breadcrumb trail. It replaces nothing in `@openflow/widgets`; a module is the Circuit model's.
 *
 * **Behaviour.** Every step but the last is a button that asks `onNavigate(index)`; the last is the
 * current level (`aria-current="location"`), not a button. A chevron parts the steps. Text is
 * clipped rather than wrapped: the earlier steps give way first.
 *
 * **Parts** (`data-part`). `root` the `nav`; `step` each item (`data-current` on the last);
 * `crumb` a step's button; `kicker` its quieter word; `sep` the chevron; `end` the host's chrome.
 */
export function GraphPath({ steps, onNavigate, label = 'Module path', end, className }: GraphPathProps) {
  return (
    <nav className={`lib-graph-path${className ? ` ${className}` : ''}`} aria-label={label} data-part="root">
      <ol className="lib-graph-path__steps">
        {steps.map((step, i) => {
          const current = i === steps.length - 1;
          const words = (
            <>
              <Text role="label" truncate tone={current ? 'primary' : 'muted'}>
                {step.label}
              </Text>
              {step.kicker && (
                <Text role="caption" tone="faint" truncate data-part="kicker">
                  {step.kicker}
                </Text>
              )}
            </>
          );
          return (
            <li key={`${i} ${step.id}`} className="lib-graph-path__step" data-part="step" {...(current ? { 'data-current': '' } : {})}>
              {i > 0 && (
                <Icon viewBox="0 0 8 8" size="caption" className="lib-graph-path__sep" data-part="sep">
                  <path d="M3 1.5 5.5 4 3 6.5" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </Icon>
              )}
              {current ? (
                <span className="lib-graph-path__crumb" aria-current="location">
                  {words}
                </span>
              ) : (
                <button type="button" className={`lib-graph-path__crumb ${focusRing}`} data-part="crumb" onClick={() => onNavigate(i)}>
                  {words}
                </button>
              )}
            </li>
          );
        })}
      </ol>
      {end !== undefined && (
        <span className="lib-graph-path__end" data-part="end">
          {end}
        </span>
      )}
    </nav>
  );
}

export default GraphPath;
