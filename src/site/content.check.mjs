import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readContent, siteUrl } from './content.mjs';
import { parseFlowchart } from './flowchart.mjs';

test('flowcharts reject malformed stages and unresolved edges with source context', () => {
  const chart = { title: 'Flow', description: 'A flow', nodes: [{ id: 'a', label: 'A', x: 0, y: 0 }, { id: 'b', label: 'B', x: 0, y: 180 }], edges: [{ from: 'a', to: 'b', label: 'next' }] };
  assert.deepEqual(parseFlowchart(JSON.stringify(chart), 'architecture.md'), chart);
  assert.throws(() => parseFlowchart('{', 'architecture.md'), /architecture.md.*JSON/);
  assert.throws(() => parseFlowchart(JSON.stringify({ ...chart, nodes: [chart.nodes[0], chart.nodes[0]] }), 'source'), /unique/);
  assert.throws(() => parseFlowchart(JSON.stringify({ ...chart, edges: [{ from: 'a', to: 'missing', label: 'next' }] }), 'source'), /endpoints/);
});

test('flowcharts preserve Markdown order, references and searchable labels', async () => {
  const root = await mkdtemp(join(tmpdir(), 'zen-flowchart-'));
  try {
    const chart = JSON.stringify({ title: 'Flow', description: 'Ownership', nodes: [{ id: 'a', label: 'Compile', x: 0, y: 0 }], edges: [] });
    const fence = '```zen-flowchart\n' + chart + '\n```';
    await writeFile(join(root, 'README.md'), '# Before\n\n' + fence + '\n\n## After\n\n[Start](README.md#before)');
    const { pages } = await readContent({ content: [{ file: 'README.md' }] }, root);
    assert.match(pages[0].blocks[0].html, /Before/);
    assert.equal(pages[0].blocks[1].chart.nodes[0].label, 'Compile');
    assert.match(pages[0].blocks[2].html, /href="\/#before"/);
    assert.match(pages[0].text, /Ownership Compile/);
    await writeFile(join(root, 'README.md'), '# Nested\n\n' + fence.split('\n').map(line => '> ' + line).join('\n'));
    await assert.rejects(() => readContent({ content: [{ file: 'README.md' }] }, root), /top-level/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

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
