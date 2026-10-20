// DisplayArt's model: its one prop and the view a renderer draws from it (the root's attributes and
// whether the fade is drawn). No framework: `DisplayArt.tsx` (React) and `DisplayArt.svelte`
// (Svelte) both render `displayArtView`.

export interface DisplayArtModelProps {
  /** The fade from the ground on the left, which keeps the readouts over the art brighter. */
  fade?: boolean;
}

export interface DisplayArtView {
  /** The root's attributes, each a string. */
  attrs: Record<string, string | undefined>;
  /** The fade layer is drawn. */
  fade: boolean;
}

/** What the art draws from its props. */
export function displayArtView({ fade = true }: DisplayArtModelProps): DisplayArtView {
  return {
    attrs: { 'data-part': 'art', 'data-fade': fade ? 'true' : 'false', 'aria-hidden': 'true' },
    fade,
  };
}
