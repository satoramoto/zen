import { Tree } from '../../view/Tree';
import { deckStripModel, type DeckStripProps } from './DeckStrip.model';

export { beatsText } from './DeckStrip.model';
export type { DeckStripProps } from './DeckStrip.model';

export function DeckStrip(props: DeckStripProps) {
  const view = deckStripModel(props);
  return <Tree {...view} />;
}
