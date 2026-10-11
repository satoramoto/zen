import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { useId } from 'react';

export type Hue = 1 | 2 | 3 | 4;

export function Button({
  variant = 'secondary',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  return <button type="button" className={`lib-button lib-button--${variant} ${className}`.trim()} {...rest} />;
}

export function Field({
  label,
  error,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  const id = useId();
  return (
    <div className="lib-field" data-invalid={error ? 'true' : undefined}>
      <label className="lib-field__label" htmlFor={id}>
        {label}
      </label>
      <input id={id} className="lib-input" aria-invalid={error ? true : undefined} {...input} />
      {error && <span className="lib-field__error">{error}</span>}
    </div>
  );
}

export function Card({ eyebrow, title, children }: { eyebrow?: ReactNode; title?: ReactNode; children?: ReactNode }) {
  return (
    <section className="lib-card">
      {eyebrow && <div className="lib-card__eyebrow">{eyebrow}</div>}
      {title && <h3 className="lib-card__title">{title}</h3>}
      {children}
    </section>
  );
}

export function Badge({ hue, solid, children }: { hue?: Hue; solid?: boolean; children: ReactNode }) {
  return (
    <span className={`lib-badge${solid ? ' lib-badge--solid' : ''}`} data-hue={hue}>
      {!solid && <span className="lib-badge__dot" aria-hidden />}
      {children}
    </span>
  );
}

export function Lamp({ on, hue, label }: { on: boolean; hue?: Hue; label?: string }) {
  return <span className="lib-lamp" data-on={on} data-hue={hue} role="img" aria-label={label ?? (on ? 'on' : 'off')} />;
}

export function Pad({
  state = 'idle',
  hue,
  flag,
  children,
}: {
  state?: 'idle' | 'queued' | 'playing';
  hue?: Hue;
  flag?: string;
  children: ReactNode;
}) {
  return (
    <button type="button" className="lib-pad" data-state={state} data-hue={hue} aria-pressed={state === 'playing'}>
      {flag && <span className="lib-pad__flag">{flag}</span>}
      <span>{children}</span>
    </button>
  );
}

export function Readout({ value, unit, small }: { value: ReactNode; unit?: string; small?: boolean }) {
  return (
    <span className={`lib-readout${small ? ' lib-readout--small' : ''}`}>
      {value}
      {unit && <span className="lib-readout__unit">{unit}</span>}
    </span>
  );
}

export function SectionHead({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="lib-section-head">
      <span>{children}</span>
      {aside && <span>{aside}</span>}
    </div>
  );
}
