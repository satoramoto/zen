// FolderList's stories as plain props: FolderList.stories.tsx draws them (with either renderer's
// `Tree`), and the tree snapshot (`src/library/view/snapshot.test.ts`) prints every instance.
import { defineFixtures, type FixtureProps } from '../../../fixtures';
import type { FolderItem, FolderListModelProps } from './FolderList.model';

/** The style browser's folders: fake names and counts, no real style data. */
export const styleFolders: FolderItem[] = [
  { id: 'all', label: 'All styles', count: '412', tip: 'library.folder' },
  { id: 'favourites', label: 'Favourites', count: '18', tip: 'library.folder' },
  { id: 'pop', label: 'Pop & Rock', count: '86', tip: 'library.folder' },
  { id: 'ballad', label: 'Ballad', count: '41', tip: 'library.folder' },
  { id: 'dance', label: 'Dance', count: '57', tip: 'library.folder' },
  { id: 'swing', label: 'Swing & Jazz', count: '49', tip: 'library.folder' },
  { id: 'rnb', label: 'R&B', count: '33', tip: 'library.folder' },
  { id: 'country', label: 'Country', count: '28', tip: 'library.folder' },
  { id: 'latin', label: 'Latin', count: '52', tip: 'library.folder' },
  { id: 'world', label: 'World', count: '37', tip: 'library.folder' },
  { id: 'user', label: 'User styles on the external drive with a long name', count: '11', tip: 'library.folder' },
  { id: 'empty', label: 'Imported (empty)', count: '0', tip: 'library.folder', disabled: true },
];

/** The sound browser's categories. */
export const soundCategories: FolderItem[] = [
  { id: 'piano', label: 'Piano', count: '24' },
  { id: 'organ', label: 'Organ', count: '19' },
  { id: 'guitar', label: 'Guitar', count: '31' },
  { id: 'bass', label: 'Bass', count: '22' },
  { id: 'strings', label: 'Strings', count: '27' },
  { id: 'brass', label: 'Brass', count: '18' },
  { id: 'synth', label: 'Synth', count: '44' },
  { id: 'drums', label: 'Drum kits', count: '16' },
  { id: 'plugins', label: 'Sampler Deluxe', count: '8' },
];

const ALL_IDS = [...styleFolders, ...soundCategories].map((item) => item.id);

/** The controls. */
export const folderListArgTypes = {
  items: { control: 'object' },
  chosen: { control: 'select', options: [null, ...ALL_IDS] },
  label: { control: 'text' },
  width: { control: { type: 'number', min: 80, step: 10 } },
  height: { control: { type: 'number', min: 28, step: 28 } },
} as const;

/** The style folders, Pop & Rock chosen, in a 220 × 280 box. Every story starts from it. */
const styles: FixtureProps<FolderListModelProps> = { items: styleFolders, chosen: 'pop', label: 'Style folders', width: 220, height: 280 };

export const folderListStories = defineFixtures<FolderListModelProps>()({
  Styles: { args: styles },
  Keys: { args: styles },
  Sounds: { args: { ...styles, items: soundCategories, chosen: null, label: 'Sound categories', height: 252 } },
  Narrow: { args: { ...styles, chosen: 'user', width: 160 } },
});
