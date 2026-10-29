// External plugin stories aren't in Zen's default TS project. Check them against
// this checkout's exact framework/Storybook types without installing into a plugin.
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const repo = fileURLToPath(new URL('..', import.meta.url));
const plugin = process.argv[2];
if (!plugin) throw new Error('Usage: npx tsx scripts/omarchy-typecheck.ts /path/to/plugin');
const directory = mkdtempSync('/tmp/opencode/omarchy-types-');
try {
  const file = resolve(directory, 'tsconfig.json');
  writeFileSync(file, JSON.stringify({
    extends: resolve(repo, 'tsconfig.json'),
    compilerOptions: {
      allowJs: true, checkJs: false,
      types: ['node', resolve(repo, 'node_modules/vite/client')],
      typeRoots: [resolve(repo, 'node_modules/@types')],
      paths: {
        '@omarchy/*': [resolve(repo, 'src/harness/omarchy/*')],
        react: [resolve(repo, 'node_modules/@types/react/index.d.ts')],
        'react/jsx-runtime': [resolve(repo, 'node_modules/@types/react/jsx-runtime.d.ts')],
        '@storybook/react-vite': [resolve(repo, 'node_modules/@storybook/react-vite/dist/index.d.ts')],
        'storybook/test': [resolve(repo, 'node_modules/storybook/dist/test/index.d.ts')],
      },
    },
    include: [resolve(plugin, 'preview/**/*')],
  }));
  const result = spawnSync(resolve(repo, 'node_modules/.bin/tsc'), ['--noEmit', '-p', file], {stdio: 'inherit'});
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  rmSync(directory, {recursive: true});
}
