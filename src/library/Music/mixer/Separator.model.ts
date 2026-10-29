import { h, slot, type Child, type Node } from '../../view/Tree.model';

export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  style?: object | string;
}

/** Native host styles stay native; custom properties and unitless values do not gain px. */
export function mixerStyleText(style: object | string | undefined): string | undefined {
  if (typeof style === 'string' || style === undefined) return style;
  const unitless = /^(--|opacity$|zIndex$|order$|flex$|flexGrow$|flexShrink$|fontWeight$|lineHeight$|gridRow|gridColumn|scale$|aspectRatio$|strokeWidth$|fillOpacity$|strokeOpacity$)/;
  return Object.entries(style).flatMap(([name, value]) => {
    if (value === undefined || value === null || typeof value === 'boolean') return [];
    const property = name.startsWith('--') ? name : name.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
    const text = typeof value === 'number' && value !== 0 && !unitless.test(name) ? `${value}px` : String(value);
    return [`${property}: ${text}`];
  }).join('; ') || undefined;
}

/** A rule owns its clearance; neither the stroke nor the clearance may shrink. */
export function separatorView({ orientation = 'horizontal', className = '', style }: SeparatorProps = {}): Node {
  return h('div', {
    role: 'separator', 'aria-orientation': orientation,
    class: `play-separator play-separator-${orientation} ${className}`,
    style: mixerStyleText(style),
  });
}

export function mixerSectionTree(className: string, children: (Child | null)[]): Node {
  return h('div', { class: 'play-section-stack' }, separatorView(), h('div', { class: className }, children));
}

export const mixerSectionView = ({ className }: { className: string }): Node => mixerSectionTree(className, [slot('children')]);
