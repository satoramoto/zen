// The stage's registry entry for its sample plugin, for any Storybook that
// wants the stage's own stories: `omarchyStage({ plugins: { ...sample } })`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const kit = path.join(here, '..', '..', 'kit');

export const sample = {
  'zen.sample': {
    source: here,
    fixture: path.join(here, 'fixture.mjs'),
    // zen's kit goes in beside the panel, as a plugin vendors it.
    prepare(dir) {
      fs.mkdirSync(path.join(dir, 'zen'), { recursive: true });
      for (const name of fs.readdirSync(kit)) {
        if (/\.(qml|mjs)$/.test(name) && name !== 'Panel.qml') fs.copyFileSync(path.join(kit, name), path.join(dir, 'zen', name));
      }
    },
  },
};
