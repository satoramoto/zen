// The library's rule checks as functions over a folder: `@satoramoto/zen/checks`. zen's own tests
// run them on `src/library`; an app that builds parts the zen way runs them on its own folders, in
// a test. Each returns what breaks its rule, with the file and line. A check takes a folder on disk
// (a path, read in node) or a `FileSource` (`memoryFiles` holds files given as text).
//
//   import { checkContract, checkTiers, checkBindingsOnly } from '@satoramoto/zen/checks';
//   expect(checkContract('src', { folders: ['push'] })).toEqual([]);
import type { FileSource } from './tiers';
import * as rules from './foundation/checks/rules';

export { memoryFiles, type FileSource, type Counts as TierCounts, type Finding as TierFinding } from './tiers';
export { CONTRACT_VARS, type ContractFinding } from './foundation/checks/rules';

/** Node's `fs`, loaded when a check first reads the disk: the entry imports nothing of node, so a
 *  page can import it and run the checks on `memoryFiles`. */
function nodeFs(): typeof import('node:fs') {
  const fs = (globalThis as { process?: { getBuiltinModule?: (id: string) => unknown } }).process?.getBuiltinModule?.('node:fs');
  if (!fs) throw new Error('checks: reading a folder needs node (22.3 or later); give a check memoryFiles(…) elsewhere');
  return fs as typeof import('node:fs');
}

const join = (...parts: string[]) => parts.filter(Boolean).join('/').replace(/\/+/g, '/');

/** A folder on disk as a `FileSource` (node). */
export function diskFiles(root: string): FileSource {
  return {
    files(dir) {
      const fs = nodeFs();
      const base = join(root, dir);
      if (!fs.existsSync(base)) return [];
      return fs
        .readdirSync(base, { recursive: true, encoding: 'utf8' })
        .filter((f) => fs.statSync(join(base, f)).isFile())
        .map((f) => f.split('\\').join('/'));
    },
    read: (path) => nodeFs().readFileSync(join(root, path), 'utf8'),
  };
}

const sourceOf = (root: string | FileSource) => (typeof root === 'string' ? diskFiles(root) : root);

/** The contract check: only the contract's variables or declared ones, no literal colour or radius, no `light-dark()`. */
export const checkContract = (root: string | FileSource, options?: Parameters<typeof rules.checkContract>[1]) => rules.checkContract(sourceOf(root), options);
/** The tier rules, each count held to a baseline; an app's folder is read as an area (`readAs: 'area'`). */
export const checkTiers = (root: string | FileSource, options?: Parameters<typeof rules.checkTiers>[1]) => rules.checkTiers(sourceOf(root), options);
/** The bindings-only rule: no element markup but `<Tree …/>` in a part's renderers. */
export const checkBindingsOnly = (root: string | FileSource, options?: Parameters<typeof rules.checkBindingsOnly>[1]) => rules.checkBindingsOnly(sourceOf(root), options);
