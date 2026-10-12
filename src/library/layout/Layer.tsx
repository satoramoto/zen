import type { CSSProperties, ElementType, ReactNode } from 'react';
import type { LayerName } from '../contract';
import './Layer.css';

export interface LayerProps {
  /** Which layer of the depth stack this surface is. */
  level: LayerName;
  /** The element to render; default `div`. */
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  [attr: `data-${string}` | `aria-${string}`]: unknown;
  role?: string;
  id?: string;
}

/**
 * **Job.** A surface at one depth: a region's plate (`base`), a popover (`float`), a sheet
 * (`overlay`). The theme's `layers` decide how it is drawn and how it composites over what's
 * behind: a tone step, a bevelled panel with a cast shadow, or a frosted pane that blurs the
 * layers beneath. Components name a depth, never a look.
 */
export function Layer({ level, as: Tag = 'div', className, children, ...rest }: LayerProps) {
  return (
    <Tag className={`lib-layer${className ? ` ${className}` : ''}`} data-layer={level} {...rest}>
      {children}
    </Tag>
  );
}

/**
 * **Job.** Where translucency can't composite: over a native view the web page can't blur (a
 * video, a GPU preview). Every layer inside draws its opaque `solid` fill and no backdrop, so a
 * panel over the picture never shows a smear. Wrap what sits over a `Hole` in this.
 */
export function Opaque({ children, className, style }: { children?: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`lib-opaque${className ? ` ${className}` : ''}`} style={style}>
      {children}
    </div>
  );
}

/**
 * **Job.** A cut-out through every layer to what's behind the page (the native preview), so the
 * ground shows through. It paints nothing; panels over it go in an `Opaque` scope.
 */
export function Hole({ className, style, children, name }: { className?: string; style?: CSSProperties; children?: ReactNode; name?: string }) {
  return (
    <div className={`lib-hole${className ? ` ${className}` : ''}`} data-part="hole" aria-label={name} role={name ? 'img' : undefined} style={style}>
      {children}
    </div>
  );
}
