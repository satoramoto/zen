// The sample plugin's fixture: it answers `stage-sample` and nothing else.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export default function fixture(state, session) {
  let asked = 0;
  // A place outside the session, in the person's own cache, for the write probe.
  const outside = path.join(os.homedir(), '.cache', 'omarchy-stage', `probe-${path.basename(session.dir ?? 'x')}`);
  return {
    commands: {
      'stage-sample'(call) {
        if (call.argv[0] === 'where') return { stdout: `${outside}\n` };
        asked++;
        return { stdout: `${state.greeting ?? 'Hello from the fixture'} (${call.argv.join(' ')}, #${asked})\n` };
      },
    },
    ops: {
      asked: () => asked,
      /** Whether the write probe's file exists outside the session. */
      wroteOutside: () => fs.existsSync(outside),
      outside: () => outside,
    },
  };
}
