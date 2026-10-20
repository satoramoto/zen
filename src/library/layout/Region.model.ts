// Region's model: the elements a renderer draws (the section, the body) and the choices behind
// them (whether there is a header, which view is chosen, the tab and panel ids). No framework:
// `Region.tsx` (React) and `Region.svelte` (Svelte) both render these.
import type { Step } from '../primitives/step';
import type { ElementView } from '../primitives/Text.model';
import type { StyleDecls } from './style';

/** An element's class and attributes plus its inline style declarations. */
export interface StyledView extends ElementView {
  style: StyleDecls;
}

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

/** The region's `section`: `lib-region` plus the caller's class, its name, whether it has views, and its grid area. */
export function regionView({ name, area, fit, className }: RegionModelProps, tabbed = false): StyledView {
  return {
    className: `lib-region${className ? ` ${className}` : ''}`,
    attrs: {
      'aria-label': name,
      'data-part': 'region',
      'data-tabbed': tabbed ? 'true' : undefined,
      'data-fit': fit === 'content' ? 'content' : undefined,
    },
    style: { 'grid-area': area || undefined },
  };
}

/** The tab and panel ids of a tabbed region, from a per-instance unique prefix. */
export function regionIds(uid: string) {
  return { panel: `${uid}-panel`, tab: (id: string) => `${uid}-tab-${id}` };
}

/** The region's body: its gap step and, when tabbed, the tabpanel of the chosen view's tab. */
export function regionBodyView(gap: Step | undefined, tabbed?: { panelId: string; tabId: string | undefined }): ElementView {
  return {
    className: 'lib-region__body',
    attrs: {
      'data-part': 'body',
      'data-gap': gap === undefined ? undefined : String(gap),
      id: tabbed?.panelId,
      role: tabbed ? 'tabpanel' : undefined,
      'aria-labelledby': tabbed?.tabId,
    },
  };
}

/** Whether the region draws its header strip: a label, an aside or views. */
export const regionHasHead = (label: unknown, aside: unknown, tabbed: boolean): boolean => Boolean(label || aside || tabbed);

/** The chosen view: the one named by `view` (controlled) or `own` (the region's own choice), else the first. */
export function chosenView<V extends { id: string }>(views: readonly V[], view: string | undefined, own: string | undefined): V | undefined {
  const id = view ?? own;
  return views.find((v) => v.id === id) ?? views[0];
}
