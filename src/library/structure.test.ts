import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { areaOf, checkStructure, isPartFile, titleIn, titlePrefix } from './structure';

const none = () => '';

describe('structure checker', () => {
  it('finds the area and the title a stories file starts with', () => {
    expect(areaOf('music/live/screens/Daws/DAWs.stories.tsx')).toBe('music/live');
    expect(areaOf('music/components/Knob/Knob.tsx')).toBe('music');
    expect(areaOf('nowhere/X/X.tsx')).toBeNull();
    expect(titlePrefix('music/live/screens/Daws/DAWs.stories.tsx')).toBe('Music/Live/Screens');
    expect(titlePrefix('components/Button/Button.stories.tsx')).toBe('Core/Components');
    expect(titlePrefix('theme-editor/components/ThemePicker/ThemePicker.stories.tsx')).toBe('Theme Editor/Components');
    expect(titleIn("const meta = { title: 'Graph/Screens/Circuit/Samples', args: { title: 'A/B' } }")).toBe('Graph/Screens/Circuit/Samples');
  });

  it('reads a capitalised file name as a part file, and docs as docs', () => {
    expect(isPartFile('Fader.tsx')).toBe(true);
    expect(isPartFile('Fader.model.ts')).toBe(true);
    expect(isPartFile('Fader.lifecycle.test.ts')).toBe(true);
    expect(isPartFile('fader.ts')).toBe(false);
    expect(isPartFile('README.md')).toBe(false);
  });

  it('passes parts in their folders, helpers beside them and an area’s own files', () => {
    expect(
      checkStructure(
        [
          'index.ts',
          'foundation/view/Tree.tsx',
          'primitives/Text/Text.tsx',
          'primitives/step.ts',
          'components/Button/Button.tsx',
          'music/index.ts',
          'music/theme.css',
          'music/model/param/param.ts',
          'music/components/Knob/Knob.tsx',
          'music/components/pressables.css',
          'music/live/panes.ts',
          'music/live/screens/Daws/daws.ts',
          'yahaha/STAGE.md',
        ],
        none,
      ),
    ).toEqual([]);
  });

  it('names a part file that sits loose, and the folder it belongs in', () => {
    const problems = checkStructure(['music/components/Knob.tsx', 'music/Scope.tsx', 'layouts/Group.css'], none);
    expect(problems).toHaveLength(3);
    expect(problems.join('\n')).toContain('music/components/Knob/');
    expect(problems.join('\n')).toContain('music/<tier>/Scope/');
    expect(problems.join('\n')).toContain('layouts/Group/');
  });

  it('names a folder that is neither a tier nor a declared area', () => {
    expect(checkStructure(['music/stories/Mixer.story.tsx'], none)[0]).toMatch(/^music\/stories\/: neither a tier/);
    expect(checkStructure(['widgets/Thing/Thing.tsx'], none)[0]).toMatch(/^widgets\/: not a declared area/);
    expect(checkStructure(['graph/components/helpers/x.ts'], none)[0]).toMatch(/^graph\/components\/helpers\/: a folder in graph\/components\/ is a part/);
    expect(checkStructure(['notes.ts'], none)[0]).toMatch(/^notes\.ts: not a root file/);
  });

  it('keeps renderers out of model/', () => {
    expect(checkStructure(['graph/model/Face.tsx'], none)[0]).toContain('no renderer files');
    expect(checkStructure(['graph/model/use.ts'], () => "import { useState } from 'react';")[0]).toContain('neither React nor Svelte');
    expect(checkStructure(['graph/model/use.ts'], () => "import type { X } from './x';")).toEqual([]);
    expect(checkStructure(['graph/model/use.test.ts'], () => "import { act } from 'react';")).toEqual([]);
  });

  it('holds a stories file to its part’s folder and its title to the path', () => {
    const file = 'music/live/screens/Daws/DAWs.stories.tsx';
    expect(checkStructure([file], () => "export default { title: 'Music/Live/Screens/DAWs' };")).toEqual([]);
    expect(checkStructure([file], () => "export default { title: 'Music/Live/DAWs' };")[0]).toContain("it starts with 'Music/Live/Screens/'");
    expect(checkStructure(['music/live/screens/DAWs.stories.tsx'], none)[0]).toContain("stories sit in their part's folder");
    expect(checkStructure(['foundation/inspector/ThemeInspector.stories.tsx'], () => "title: 'Foundation/Theme inspector'")).toEqual([]);
  });
});

describe('library structure', () => {
  it('every file is where docs/structure.md says it goes', () => {
    const root = join(process.cwd(), 'src/library');
    const files = readdirSync(root, { recursive: true, encoding: 'utf8' })
      .map((f) => f.split('\\').join('/'))
      .filter((f) => statSync(join(root, f)).isFile());
    expect(checkStructure(files, (f) => readFileSync(join(root, f), 'utf8'))).toEqual([]);
  });
});
