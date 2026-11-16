// FolderList as the DOM renderer draws it: the same tree and handlers as `FolderList.tsx` and `FolderList.svelte`.
import { domPart } from '../../foundation/view/dom';
import { folderListHandlers, folderListView, type FolderListLocal, type FolderListModelProps } from './FolderList.model';

export const FolderListDom = domPart<FolderListModelProps>({ events: ['onChoose'], value: { prop: 'chosen', on: 'onChoose' } }, (props, use) => {
  const local = use.state<FolderListLocal | null>(null);
  return { tree: folderListView(props, local.get()), handlers: folderListHandlers(props, local.set) };
});
