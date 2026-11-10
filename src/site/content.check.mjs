import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readContent, siteUrl } from './content.mjs';

test('project-base URLs reject traversal', () => {
  assert.equal(siteUrl('/project/', 'architecture'), '/project/architecture/');
  assert.equal(siteUrl('/', ''), '/');
  assert.throws(() => siteUrl('/project/../secret'));
});

test('source links and generated mounts survive static publishing', async () => {
  const root = await mkdtemp(join(tmpdir(), 'zen-site-'));
  try {
    await mkdir(join(root, 'docs'));
    await mkdir(join(root, 'reference'));
    await writeFile(join(root, 'README.md'), '# Home\n[Architecture](docs/architecture.md#ownership)\n![Diagram](docs/diagram.svg)');
    await writeFile(join(root, 'docs/architecture.md'), '# Architecture\nOwnership of state.');
    await writeFile(join(root, 'docs/diagram.svg'), '<svg/>');
    await writeFile(join(root, 'reference/index.html'), '<h1>Generated</h1>');
    const options = { base: '/project/', content: [{ file: 'README.md' }, { directory: 'docs' }], generated: [{ from: 'reference', to: 'api', title: 'API' }] };
    const content = await readContent(options, root);
    assert.match(content.pages[0].html, /href="\/project\/architecture\/#ownership"/);
    assert.match(content.pages[0].html, /src="\/project\/assets\//);
    assert.equal(content.mounts[0].href, '/project/api/index.html');
    assert.equal(content.assets.length, 1);
    await assert.rejects(() => readContent({ ...options, content: [...options.content, { file: 'README.md' }] }, root), /Duplicate/);
    await assert.rejects(() => readContent({ ...options, generated: [{ from: 'reference', to: 'architecture' }] }, root), /Conflicting/);
    await writeFile(join(root, 'README.md'), '# Home\n[Missing](missing.md)');
    await assert.rejects(() => readContent(options, root), /Undiscovered Markdown/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
