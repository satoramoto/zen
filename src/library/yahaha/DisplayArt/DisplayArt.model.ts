// DisplayArt's model: its one prop and the tree it draws (the root with the sun, the two hills and,
// unless bare, the fade). No framework: `DisplayArt.tsx` (React) and `DisplayArt.svelte` (Svelte)
// both pass `displayArtView` to their `Tree`.
import { h, type Node } from '../../view/Tree.model';

export interface DisplayArtModelProps {
  /** The fade from the ground on the left, which keeps the readouts over the art brighter. */
  fade?: boolean;
}

/** The tree the art draws from its props: decorative, hidden from assistive tech. */
export function displayArtView({ fade = true }: DisplayArtModelProps): Node {
  return h(
    'div',
    { class: 'yh-displayart', 'data-part': 'art', 'data-fade': fade ? 'true' : 'false', 'aria-hidden': 'true' },
    h('div', { class: 'yh-displayart__sun', 'data-part': 'sun' }, h('div', { class: 'yh-displayart__disc', 'data-part': 'disc' })),
    h('div', { class: 'yh-displayart__hill', 'data-part': 'hill', 'data-hill': 'far' }),
    h('div', { class: 'yh-displayart__hill', 'data-part': 'hill', 'data-hill': 'near' }),
    fade ? h('div', { class: 'yh-displayart__fade', 'data-part': 'fade' }) : null,
  );
}
