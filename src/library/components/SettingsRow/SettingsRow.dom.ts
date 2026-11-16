// SettingsRow as the DOM renderer draws it: the same tree and handlers as `SettingsRow.tsx` and `SettingsRow.svelte`.
import { domPart } from '../../foundation/view/dom';
import type { DomFill } from '../../foundation/view/Tree.dom';
import { settingsRowView, type SettingsRowModelProps } from './SettingsRow.model';

export const SettingsRowDom = domPart<SettingsRowModelProps & { children?: DomFill }>({}, ({ children, ...props }, use) => ({
  tree: settingsRowView(props, use.id()),
  slots: { children },
}));
