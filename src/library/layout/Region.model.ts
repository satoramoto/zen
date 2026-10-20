// Region's model: the tree a renderer draws (the section, its header strip with the label, the
// views' Tabs and the aside, and the body) and its handlers (a tab's choice). No framework:
// `Region.tsx` (React) and `Region.svelte` (Svelte) each hand `regionView` to their `Tree`. The
// region's own choice of view (uncontrolled) is local view state (`localState`, ./local.ts): the
// binding reads it and passes it in, the handlers write it back.
import type { Step } from '../primitives/step';
import { textView } from '../primitives/Text.model';
import { component, h, slot, styleText, when, type Handlers, type Node } from '../view/Tree.model';
import type { TipAction } from '../components/core/Button/Button.model';
import type { LocalState } from './local';
import type { TabItemModel } from './Tabs.model';

/** What Region decides from, in any framework (each renderer adds its label, aside, views and children). */
export interface RegionModelProps {
  /** The region's accessible name ("Mixer", "Song form"). */
  name: string;
  /** The grid area this region fills in its screen. */
  area?: string;
  /** The space between the Groups in the body, as a scale step. Default none. */
  gap?: Step;
  /** How the region takes its height: `fill` (default) or `content`. */
  fit?: 'fill' | 'content';
  /** Classes added after the region's own. */
  className?: string;
}

/** One view of a region: its tab (id, label, name, disabled, tip). The label is data, handed to
 *  `Tabs` as is (text; `L` lets a renderer's own label type through). */
export type RegionViewItem<L = string> = TabItemModel<L>;

/** Everything `regionView` draws from: the model's props, the label and aside as text (a node or a
 *  snippet is a slot instead, `RegionSlots`), the caller's inline style, and the views. */
export interface RegionDrawProps<L = string> extends RegionModelProps {
  /** A visible header label, as text. */
  label?: string;
  /** Header content on the right, as text. */
  aside?: string;
  /** The caller's inline style, after the region's own. */
  style?: string;
  /** The views: the header shows a tab per view and the body the chosen one's slot (`regionViewSlot`). */
  views?: readonly RegionViewItem<L>[];
  /** The chosen view's id (controlled). */
  view?: string;
  /** The app's tooltip action: the tree only names it (`tipAction`) when one is given. */
  tipAction?: TipAction;
}

/** Which of the header's slots the binding fills (a label or aside that isn't text). */
export interface RegionSlots {
  label?: boolean;
  aside?: boolean;
}

/** The binding's part: its per-instance id (`useId`, `$props.id()`) and the region's own choice. */
export interface RegionState {
  uid: string;
  own?: string;
}

/** The tab and panel ids of a tabbed region, from a per-instance unique prefix. */
export function regionIds(uid: string) {
  return { panel: `${uid}-panel`, tab: (id: string) => `${uid}-tab-${id}` };
}

/** The chosen view: the one named by `view` (controlled) or `own` (the region's own choice), else the first. */
export function chosenView<V extends { id: string }>(views: readonly V[], view: string | undefined, own: string | undefined): V | undefined {
  const id = view ?? own;
  return views.find((v) => v.id === id) ?? views[0];
}

/** The region's own choice when it starts: `defaultView`, else the first view. */
export const regionInitialView = (views: readonly { id: string }[], defaultView?: string): string | undefined => defaultView ?? views[0]?.id;

/** The slot a view's body fills: `view:<id>`. */
export const regionViewSlot = (id: string): string => `view:${id}`;

/** React properties that take a bare number (the rest get `px`). */
const UNITLESS = new Set([
  'animationIterationCount',
  'aspectRatio',
  'columnCount',
  'columns',
  'flex',
  'flexGrow',
  'flexShrink',
  'fontWeight',
  'gridArea',
  'gridColumn',
  'gridColumnEnd',
  'gridColumnStart',
  'gridRow',
  'gridRowEnd',
  'gridRowStart',
  'lineHeight',
  'opacity',
  'order',
  'orphans',
  'scale',
  'tabSize',
  'widows',
  'zIndex',
  'zoom',
  'fillOpacity',
  'strokeOpacity',
  'strokeWidth',
]);

/** A React style object as a `style` string (`minWidth: 2` → `min-width: 2px`), for a tree. */
export function cssText(style: object | undefined): string | undefined {
  if (!style) return undefined;
  const decls: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null || value === '' || typeof value === 'boolean') continue;
    const name = key.startsWith('--') ? key : key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`).replace(/^ms-/, '-ms-');
    decls[name] = typeof value === 'number' && value !== 0 && !key.startsWith('--') && !UNITLESS.has(key) ? `${value}px` : String(value);
  }
  return styleText(decls);
}

/** Inline styles joined in order (the caller's after the component's own); undefined when empty. */
export const joinStyle = (...parts: (string | undefined)[]): string | undefined =>
  parts
    .map((part) => part?.trim().replace(/;$/, ''))
    .filter(Boolean)
    .join('; ') || undefined;

/**
 * The tree Region draws: the `section` (`lib-region` plus the caller's class, its name, whether it
 * has views, its fit and grid area), the header strip when there is a label, an aside or views
 * (the label as a caption `Text`, the views' `Tabs`, the aside), and the body (with views, the
 * chosen view's tabpanel holding its slot; without, the `children` slot).
 */
export function regionView<L>(props: RegionDrawProps<L>, slots: RegionSlots, { uid, own }: RegionState): Node {
  const { name, area, gap, fit, className, label, aside, style, views = [], view, tipAction } = props;
  const tabbed = views.length > 0;
  const chosen = chosenView(views, view, own);
  const ids = regionIds(uid);
  const hasLabel = Boolean(slots.label || label);
  const hasAside = Boolean(slots.aside || aside);
  const text = textView({ size: 'caption', weight: 'strong', case: 'label', className: 'lib-region__label' });
  return h(
    'section',
    {
      class: `lib-region${className ? ` ${className}` : ''}`,
      'aria-label': name,
      'data-part': 'region',
      'data-tabbed': tabbed ? 'true' : undefined,
      'data-fit': fit === 'content' ? 'content' : undefined,
      style: joinStyle(styleText({ 'grid-area': area || undefined }), style),
    },
    when(hasLabel || hasAside || tabbed, () =>
      h(
        'header',
        { class: 'lib-region__head', 'data-part': 'head' },
        when(hasLabel, () => h('span', { class: text.className, ...text.attrs }, slots.label ? slot('label') : (label ?? null))),
        when(tabbed && chosen !== undefined, () =>
          component(
            'Tabs',
            {
              name,
              items: views.map(({ id, label: tab, name: tabName, disabled, tip }) => ({ id, label: tab, name: tabName, disabled, tip })),
              value: chosen!.id,
              panelId: ids.panel,
            },
            { on: { onChange: 'choose', tabId: 'tabId', ...(tipAction ? { tipAction: 'tipAction' } : {}) } },
          ),
        ),
        when(hasAside, () => h('span', { class: 'lib-region__aside' }, slots.aside ? slot('aside') : (aside ?? null))),
      ),
    ),
    h(
      'div',
      {
        class: 'lib-region__body',
        'data-part': 'body',
        'data-gap': gap === undefined ? undefined : String(gap),
        id: tabbed ? ids.panel : undefined,
        role: tabbed ? 'tabpanel' : undefined,
        'aria-labelledby': tabbed && chosen ? ids.tab(chosen.id) : undefined,
      },
      tabbed ? (chosen ? slot(regionViewSlot(chosen.id)) : null) : slot('children'),
    ),
  );
}

/** What Region's handlers act on: the controlled view, the callback and the tooltip action. */
export interface RegionHandlerProps {
  view?: string;
  onView?: (id: string) => void;
  tipAction?: TipAction;
}

/** The callbacks the tree names: a tab's choice (`choose`: kept as the region's own when
 *  uncontrolled, then `onView`), the tabs' DOM ids (`tabId`) and the tooltip action. */
export function regionHandlers({ view, onView, tipAction }: RegionHandlerProps, own: Pick<LocalState<string | undefined>, 'set'>, uid: string): Handlers {
  return {
    choose: (id: string) => {
      if (view === undefined) own.set(id);
      onView?.(id);
    },
    tabId: regionIds(uid).tab,
    tipAction,
  };
}

/** A label or aside the tree can't hold as text (a React node, a snippet): the binding fills its slot. */
export const isSlotContent = (value: unknown): boolean =>
  value !== undefined && value !== null && value !== false && value !== '' && typeof value !== 'string';
