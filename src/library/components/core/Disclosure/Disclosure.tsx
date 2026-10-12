import { useToggle, type ControlSize } from '../Toggle/useToggle';
import '../Toggle/size.css';
import { focusRing } from '../../../primitives/Ring';
import './Disclosure.css';

export interface DisclosureProps {
  /** What it shows or hides. */
  'aria-label': string;
  size?: ControlSize;
  disabled?: boolean;
  /** Controlled; leave it out to let it keep its own state from `defaultExpanded`. */
  expanded?: boolean;
  defaultExpanded?: boolean;
  onChange?: (expanded: boolean) => void;
  /** The id of what it shows or hides. */
  controls?: string;
}

/**
 * A disclosure button: shows or hides what it names.
 *
 * **Job.** Open the details under a row or a section (Advanced options) without leaving the page.
 *
 * **Behaviour.** A button with `aria-expanded` (and `aria-controls` when `controls` is given), so
 * a click, Space or Enter turns it. Controlled with `expanded` or its own from `defaultExpanded`;
 * `onChange` hears the new state. The chevron points down when closed and up when open. Disabled
 * doesn't turn.
 *
 * **Parts** (`data-part`): `root` (the button: a square of the size's height, the theme's `key`
 * material, its pressed shadow while held), `chevron`.
 */
export function Disclosure({
  size = 'regular',
  disabled,
  expanded,
  defaultExpanded = false,
  onChange,
  controls,
  'aria-label': ariaLabel,
}: DisclosureProps) {
  const [open, set] = useToggle(expanded, defaultExpanded, onChange);
  return (
    <button
      type="button"
      className={`lib-disclosure lib-sized ${focusRing}`}
      data-part="root"
      data-size={size}
      aria-label={ariaLabel}
      aria-expanded={open}
      aria-controls={controls}
      disabled={disabled}
      onClick={() => set(!open)}
    >
      <svg className="lib-disclosure__chevron" data-part="chevron" viewBox="0 0 12 12" aria-hidden="true">
        <path d="M2.4 4.4 6 8 9.6 4.4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export default Disclosure;
