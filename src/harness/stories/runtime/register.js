// Runs inside Vitest. The runner appends a call to `register` to each stories file it plays;
// the file is then its own test file, one test per story, named by the story's id.
import { expect, it } from 'vitest';
import { composeStories } from 'virtual:zen-stories/framework';

/** `wanted`: export name -> story id, for the stories of `file` this run plays. */
export function register(file, wanted, module) {
  // A stories file imported by another one is not the file under test: it registers nothing.
  if (expect.getState().testPath !== file) return;
  let stories = {};
  let broken = null;
  try { stories = composeStories(module); } catch (e) { broken = e; }
  for (const [exportName, id] of Object.entries(wanted)) {
    it(id, async () => {
      if (broken) throw broken;
      const Story = stories[exportName];
      if (!Story) throw new Error(`${file} has no story export ${exportName}`);
      await Story.run();
    });
  }
}
