import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, relative, dirname, extname, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { Marked } from 'marked';
import { parseFlowchart } from './flowchart.mjs';

export function routePath(value = '') {
  const route = value.replace(/^\/+|\/+$/g, '');
  if (route && !route.split('/').every(part => /^[a-zA-Z0-9_-]+$/.test(part))) {
    throw new Error(`Invalid site route: ${value}`);
  }
  return route;
}

export function siteUrl(base, route = '') {
  return `/${[routePath(base), routePath(route)].filter(Boolean).join('/')}/`.replace(/^\/\//, '/');
}

async function markdownFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory() && !entry.name.startsWith('.')) files.push(...await markdownFiles(path));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(path);
  }
  return files;
}

/** Read trusted repository Markdown once; rewrite source-relative links to output routes. */
export async function readContent(options, root) {
  const base = siteUrl(options.base ?? '/');
  const pages = [];
  const routes = new Set();
  for (const source of options.content ?? []) {
    const files = source.file ? [resolve(root, source.file)] : await markdownFiles(resolve(root, source.directory));
    for (const file of files) {
      const slug = routePath(source.file ? source.slug ?? '' : [source.prefix, relative(resolve(root, source.directory), file).replace(/\.md$/, '').replace(/(?:^|\/)index$/, '')].filter(Boolean).join('/'));
      if (routes.has(slug)) throw new Error(`Duplicate site route: ${slug || '/'}`);
      routes.add(slug);
      const markdown = await readFile(file, 'utf8');
      const title = source.title ?? markdown.match(/^#\s+(.+)$/m)?.[1] ?? basename(file, '.md');
      pages.push({ file, slug, title, markdown, href: siteUrl(base, slug) });
    }
  }
  if (!pages.length) throw new Error('A Zen site needs at least one Markdown page');
  const byFile = new Map(pages.map(page => [page.file, page]));
  const assets = new Map();
  for (const page of pages) {
    const parser = new Marked({ async: true });
    const headings = new Map();
    const charts = [];
    const marker = `zen-flowchart-${createHash('sha256').update(page.markdown).digest('hex')}`;
    let topLevel;
    parser.use({ hooks: { processAllTokens(tokens) { topLevel = new Set(tokens); return tokens; } }, renderer: {
      code(token) {
        if (token.lang !== 'zen-flowchart') return false;
        if (!topLevel.has(token)) throw new Error(`zen-flowchart must be a top-level block in ${page.file}`);
        charts.push(parseFlowchart(token.text, page.file));
        return `<!--${marker}:${charts.length - 1}-->`;
      },
    } });
    parser.use({ renderer: { heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      const key = text.replace(/<[^>]*>/g, '').toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/\s+/g, '-');
      const count = headings.get(key) ?? 0;
      headings.set(key, count + 1);
      return `<h${depth} id="${key}${count ? `-${count}` : ''}">${text}</h${depth}>\n`;
    } } });
    parser.use({ walkTokens: async token => {
      if (token.type !== 'link' && token.type !== 'image') return;
      const href = token.href;
      if (/^(https?:|mailto:|tel:|#)/i.test(href)) return;
      if (/^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith('//')) throw new Error(`Unsupported link in ${page.file}: ${href}`);
      // Root URLs are relative to the site's configured base, not the hosting domain.
      if (href.startsWith('/')) { token.href = base + href.slice(1); return; }
      const [, path, suffix = ''] = href.match(/^([^?#]*)(.*)$/);
      const target = resolve(dirname(page.file), decodeURIComponent(path));
      const document = byFile.get(target);
      if (document) { token.href = document.href + suffix; return; }
      if (extname(target) === '.md') throw new Error(`Undiscovered Markdown link in ${page.file}: ${href}`);
      if (!(await stat(target)).isFile()) throw new Error(`Not a file: ${target}`);
      const key = createHash('sha256').update(target).digest('hex').slice(0, 12);
      const destination = `assets/${key}-${basename(target)}`;
      assets.set(target, destination);
      token.href = base + destination + suffix;
    } });
    page.html = await parser.parse(page.markdown);
    if (charts.length) {
      const pieces = page.html.split(new RegExp(`<!--${marker}:(\\d+)-->`));
      page.blocks = pieces.map((part, i) => i % 2 ? { chart: charts[Number(part)] } : { html: part });
    }
    page.text = [page.html.replace(/<[^>]*>/g, ' '), ...charts.map(chart =>
      [chart.title, chart.description, ...chart.nodes.flatMap(node => [node.label, node.detail ?? '']), ...chart.edges.map(edge => edge.label)].join(' '))].join(' ').replace(/\s+/g, ' ').trim();
    delete page.markdown;
  }
  const mounts = [];
  for (const mount of options.generated ?? []) {
    const to = routePath(mount.to);
    if (!to || routes.has(to) || pages.some(page => page.slug.startsWith(to + '/')) || ['assets', '_astro'].includes(to)) throw new Error(`Conflicting generated mount: ${to}`);
    if (mounts.some(other => to === other.to || to.startsWith(other.to + '/') || other.to.startsWith(to + '/'))) throw new Error(`Overlapping generated mount: ${to}`);
    const from = resolve(root, mount.from);
    const entry = mount.entry ?? 'index.html';
    if (entry.startsWith('/') || entry.split('/').some(part => part === '..' || part === '.')) throw new Error(`Invalid generated entry: ${entry}`);
    if (!(await stat(resolve(from, entry))).isFile()) throw new Error(`Missing generated entry: ${from}/${entry}`);
    mounts.push({ ...mount, from, to, href: base + to + '/' + entry });
  }
  return { pages, assets: [...assets], mounts };
}
