import { defineSite } from '@satoramoto/zen/astro';
export default defineSite({
  title: 'Zen field notes', description: 'A static documentation package fixture',
  site: 'https://example.test', base: '/project/', revision: 'fixture-commit',
  content: [{ file: './content/overview.md', slug: '' }, { file: './content/architecture.md', slug: 'architecture' }],
  generated: [{ from: './reference', to: 'api', title: 'API reference' }],
});
