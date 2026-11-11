import { Tree } from '../../foundation/view/Tree';
import { codeImageView, type CodeImageModelProps } from './CodeImage.model';
import './CodeImage.css';

// The encoder and the drawing are framework-free, in the model; this file and `CodeImage.svelte`
// only hand the model's tree to their `Tree`.
export type { CodeImageModelProps } from './CodeImage.model';

export type CodeImageProps = CodeImageModelProps;

/**
 * CodeImage: a text as a code a phone can scan.
 *
 * **Job.** Hand an address to another device without typing: a link to further material, a
 * pairing page. It is a QR code (byte mode, error correction M), up to 213 bytes.
 *
 * **Colour.** Dark marks on a light ground with a clear margin, in every pack and mode: a scanner
 * reads nothing else. The ground and the marks keep the pack's hues, made light and dark.
 *
 * **Size.** `--lib-code-size` wide and as high (four controls by default); set it on the part's
 * parent. A text too long to hold draws nothing: show the text beside it, always.
 */
export function CodeImage(props: CodeImageProps) {
  return <Tree tree={codeImageView(props)} />;
}
