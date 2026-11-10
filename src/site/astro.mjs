import react from '@astrojs/react';
import { fileURLToPath } from 'node:url';
import { cp, mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, resolve, extname, sep } from 'node:path';
import { readContent, siteUrl } from './content.mjs';

/** Configure a static Zen site. Content paths are relative to the Astro project root. */
export function defineSite(options) {
  const base = siteUrl(options.base ?? '/');
  let content;
  const integration = {
    name: '@satoramoto/zen/site',
    hooks: {
      'astro:config:setup': async ({ config, injectRoute, updateConfig }) => {
        content = await readContent(options, fileURLToPath(config.root));
        const payload = { ...options, base, ...content, assets: undefined };
        updateConfig({ vite: { plugins: [{
          name: 'zen-site-content',
          resolveId(id) { if (id === 'virtual:zen-site') return '\0virtual:zen-site'; },
          load(id) { if (id === '\0virtual:zen-site') return `export default ${JSON.stringify(payload)}`; },
        }] } });
        injectRoute({ pattern: '/[...slug]', entrypoint: fileURLToPath(new URL('./Document.astro', import.meta.url)), prerender: true });
      },
      'astro:build:done': async ({ dir }) => {
        const output = fileURLToPath(dir);
        for (const [from, to] of content.assets) {
          await mkdir(dirname(resolve(output, to)), { recursive: true });
          await cp(from, resolve(output, to));
        }
        for (const mount of content.mounts) await cp(mount.from, resolve(output, mount.to), { recursive: true });
        await writeFile(resolve(output, '.nojekyll'), '');
      },
      'astro:server:setup': ({ server }) => {
        // Serve the same source assets and generated mounts during local Astro development.
        server.middlewares.use(async (request, response, next) => {
          try {
            const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
            const asset = content.assets.find(([, to]) => pathname === base + to);
            let file = asset?.[0];
            if (!file) {
              const mount = content.mounts.find(mount => pathname.startsWith(base + mount.to + '/'));
              if (mount) {
                const suffix = pathname.slice((base + mount.to + '/').length);
                const candidate = resolve(mount.from, suffix || 'index.html');
                if (!candidate.startsWith(mount.from + sep)) { response.statusCode = 403; response.end(); return; }
                file = candidate;
              }
            }
            if (!file) { next(); return; }
            const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' };
            response.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
            response.end(await readFile(file));
          } catch { response.statusCode = 404; response.end('Not found'); }
        });
      },
    },
  };
  return {
    site: options.site,
    base,
    output: 'static',
    trailingSlash: 'always',
    integrations: [react(), integration],
    vite: { resolve: { dedupe: ['react', 'react-dom'] } },
  };
}
