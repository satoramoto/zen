// The virtual-DOM pass: every selected story composed under the project's own Storybook preview
// and played on jsdom by Vitest, each stories file its own test file.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fileOf } from './select.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTER = path.join(here, 'runtime', 'register.js');
const SETUP = [path.join(here, 'runtime', 'standins.js'), path.join(here, 'runtime', 'setup.js')];
const FRAMEWORK = 'virtual:zen-stories/framework';
const PREVIEW = 'virtual:zen-stories/preview';

async function need(name, why) {
  try { return await import(name); } catch (e) {
    if (e?.code !== 'ERR_MODULE_NOT_FOUND') throw e;
    throw new Error(`zen-stories needs ${why} in this project: npm install --save-dev vitest jsdom`);
  }
}

const frameworkName = (main) => (typeof main.framework === 'string' ? main.framework : main.framework?.name);

/** The Vite config Storybook would build the project's preview with: its own, then `viteFinal`. */
async function projectVite(root, main) {
  const vite = await import('vite');
  const loaded = await vite.loadConfigFromFile({ command: 'serve', mode: 'test' }, undefined, root);
  let config = { ...(loaded?.config ?? {}) };
  delete config.test;
  const plugins = (await Promise.all((config.plugins ?? []).flat(Infinity))).flat(Infinity).filter(Boolean);
  config.plugins = plugins;
  // Storybook's React framework compiles JSX with React's automatic runtime whether or not the
  // project has React's Vite plugin; so does this.
  if (!plugins.some((p) => /^vite:react/.test(p.name ?? ''))) config.oxc = { ...(config.oxc ?? {}), jsx: { runtime: 'automatic', ...(config.oxc?.jsx ?? {}) } };
  if (main.viteFinal) config = await main.viteFinal(config, { configType: 'DEVELOPMENT' });
  return config;
}

/**
 * The installed packages that depend on a module the project aliases. Storybook bundles every
 * dependency, so an alias reaches them; Vitest leaves dependencies to Node unless told to compile
 * them, and Node knows no alias. These are the ones to compile.
 */
function aliasedInto(root, config) {
  const alias = config.resolve?.alias ?? [];
  const finds = (Array.isArray(alias) ? alias.map((a) => a.find) : Object.keys(alias))
    .map((f) => (f instanceof RegExp ? f.source.replace(/^\^|\$$/g, '').replace(/\\(.)/g, '$1') : String(f)))
    .filter((name) => /^(@[\w.-]+\/)?[\w.-]+$/.test(name));
  if (!finds.length) return [];
  const modules = path.join(root, 'node_modules');
  const names = [];
  for (const entry of fs.existsSync(modules) ? fs.readdirSync(modules) : []) {
    if (entry.startsWith('.')) continue;
    if (entry.startsWith('@')) for (const sub of fs.readdirSync(path.join(modules, entry))) names.push(`${entry}/${sub}`);
    else names.push(entry);
  }
  return names.filter((name) => {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(modules, name, 'package.json'), 'utf8'));
      return finds.some((f) => pkg.dependencies?.[f] || pkg.peerDependencies?.[f]);
    } catch { return false; }
  });
}

/** Escapes a path so a glob matches it and nothing else. */
const literal = (p) => p.replace(/[\\()[\]{}!*?@+|]/g, '\\$&');

/**
 * Plays `stories` (index entries) on the virtual DOM, at most `workers` files at a time.
 * `report(result)` is called once per story: { story, ok, ms, problems }.
 */
export async function playVirtual({ root, configDir, stories, workers, timeout, stageUrl, report }) {
  if (!stories.length) return;
  const { startVitest } = await need('vitest/node', 'Vitest');
  await need('jsdom', 'jsdom');
  const { loadMainConfig } = await import('storybook/internal/common');
  const main = await loadMainConfig({ configDir });
  const framework = frameworkName(main);
  if (framework !== '@storybook/react-vite') throw new Error(`zen-stories plays React on Vite stories; this Storybook's framework is ${framework}`);
  const previewFile = ['ts', 'tsx', 'js', 'jsx', 'mjs'].map((x) => path.join(configDir, `preview.${x}`)).find((f) => fs.existsSync(f));

  // file -> { exportName: id }, and id -> story for the report.
  const wanted = new Map();
  const byId = new Map();
  for (const story of stories) {
    const file = fileOf(root, story);
    if (!wanted.has(file)) wanted.set(file, {});
    wanted.get(file)[story.exportName] = story.id;
    byId.set(story.id, story);
  }
  const reported = new Set();
  const say = (id, result) => { if (reported.has(id) || !byId.has(id)) return; reported.add(id); report({ story: byId.get(id), ...result }); };

  const plugin = {
    name: 'zen-stories',
    enforce: 'pre',
    resolveId(id) { return id === FRAMEWORK || id === PREVIEW ? `\0${id}` : null; },
    load(id) {
      if (id === `\0${FRAMEWORK}`) return `export * from ${JSON.stringify(framework)};`;
      if (id === `\0${PREVIEW}`) return previewFile ? `export * from ${JSON.stringify(previewFile)};\nimport * as all from ${JSON.stringify(previewFile)};\nexport default all.default;` : 'export default {};';
      return null;
    },
    // A stories file this run plays registers its own tests: it imports itself for its exports.
    transform(code, id) {
      const file = id.split('?')[0];
      const mine = wanted.get(file);
      if (!mine) return null;
      return { code: `${code}\nimport * as __zenStories from ${JSON.stringify(file)};\nimport { register as __zenRegister } from ${JSON.stringify(REGISTER)};\n__zenRegister(${JSON.stringify(file)}, ${JSON.stringify(mine)}, __zenStories);\n`, map: null };
    },
  };

  const text = (e) => [e?.message ?? String(e), ...(e?.diff ? [e.diff] : [])].join('\n').slice(0, 3000);
  const reporter = {
    onTestCaseResult(test) {
      const r = test.result();
      if (r.state === 'skipped' || r.state === 'pending') return;
      say(test.name, { ok: r.state === 'passed', ms: test.diagnostic()?.duration ?? 0, problems: r.state === 'passed' ? [] : (r.errors ?? []).map(text) });
    },
    // A file that could not load, or stopped, takes its unplayed stories with it.
    onTestModuleEnd(module) {
      const mine = wanted.get(module.moduleId);
      if (!mine) return;
      const errors = module.errors().map(text);
      for (const id of Object.values(mine)) say(id, { ok: false, ms: 0, problems: errors.length ? errors : ['the stories file ended before this story was played'] });
    },
  };

  const base = await projectVite(root, main);
  const env = { ...(stageUrl ? { ZEN_STORIES_STAGE_URL: stageUrl } : {}) };
  const vitest = await startVitest('test', [], {
    config: false,
    root,
    watch: false,
    environment: 'jsdom',
    include: [...wanted.keys()].map((f) => literal(path.relative(root, f))),
    exclude: ['**/node_modules/**'],
    setupFiles: SETUP,
    testTimeout: timeout,
    hookTimeout: timeout,
    maxWorkers: workers,
    // Stories files share their worker's modules: each file re-evaluating the preview and every
    // shared import cost three times the CPU for the same results. Each story still ends unmounted.
    pool: 'threads',
    isolate: false,
    minWorkers: 1,
    reporters: [reporter],
    passWithNoTests: true,
    env,
    // The runner and zen's harness ship as source: Vite compiles them wherever they are installed.
    server: { deps: { inline: [/[\\/]@satoramoto[\\/]zen[\\/]/, new RegExp(literal(here)), ...aliasedInto(root, base)] } },
  }, {
    ...base,
    plugins: [plugin, ...(base.plugins ?? [])],
    // Stories are browser code: packages are resolved as a browser would resolve them.
    resolve: { ...(base.resolve ?? {}), conditions: ['browser', 'module', 'import', 'default'] },
    server: { ...(base.server ?? {}), watch: null },
    clearScreen: false,
    logLevel: 'error',
  });
  await vitest?.close();
  // Whatever Vitest never reached (it stopped early) is a failure, never silence.
  for (const id of byId.keys()) say(id, { ok: false, ms: 0, problems: ['Vitest ended before this story was played'] });
  process.exitCode = undefined;
}
