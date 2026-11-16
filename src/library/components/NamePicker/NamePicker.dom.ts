// NamePicker as the DOM renderer draws it: the same tree and handlers as `NamePicker.tsx` and `NamePicker.svelte`.
import { domPart } from '../../foundation/view/dom';
import type { DomFill } from '../../foundation/view/Tree.dom';
import { namePickerHandlers, namePickerState, namePickerView, type NamePickerModelProps } from './NamePicker.model';
import '../../primitives/Text/Text.css';
import '../../primitives/Stack/Stack.css';
import '../../primitives/Surface/Surface.css';
import './NamePicker.css';

type Props = NamePickerModelProps & { title?: DomFill; message?: DomFill; children?: DomFill };

export const NamePickerDom = domPart<Props>({ events: ['onPick'] }, ({ title, message, children, ...props }, use) => {
  const own = use.state(() => namePickerState(props.value));
  const slots = { title: title !== undefined, message: message !== undefined, children: children !== undefined };
  return { tree: namePickerView(props, own.get(), slots), slots: { title, message, children }, handlers: namePickerHandlers(props, own) };
});
