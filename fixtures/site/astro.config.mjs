import { defineSite } from '@satoramoto/zen/astro';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { manualSources } from '../../scripts/manual-sources.mjs';
const manuals = process.env.MANUAL_BUNDLES
  ? await Promise.all(JSON.parse(await readFile(process.env.MANUAL_BUNDLES, 'utf8')).map(async item => ({
    from: item.directory, sources: await manualSources(fileURLToPath(new URL('../..', import.meta.url))),
  }))) : [];
export default defineSite({
  title: 'Zen field notes', description: 'A static documentation package fixture',
  site: 'https://example.test', base: '/project/', revision: 'fixture-commit',
  content: [{ file: './content/overview.md', slug: '' }, { file: './content/architecture.md', slug: 'architecture' }],
  manuals,
  generated: [{ from: './reference', to: 'api', title: 'API reference' }],
});
