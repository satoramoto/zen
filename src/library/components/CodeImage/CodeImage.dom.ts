// CodeImage as the DOM renderer draws it: the same tree and handlers as `CodeImage.tsx` and `CodeImage.svelte`.
import { domPart } from '../../foundation/view/dom';
import { codeImageView, type CodeImageModelProps } from './CodeImage.model';

export const CodeImageDom = domPart<CodeImageModelProps>({}, (props) => ({ tree: codeImageView(props) }));
