// The DOM renderer held to React's and Svelte's over every fixture of every part it draws: each
// part's three bindings draw the same DOM, generated ids masked (parity.ts). One line per part in
// `PARTS`, as `domComponents.ts` has one per part; a part there and not here fails.
import { describe, expect, it } from 'vitest';
import type { ComponentType } from 'react';
import { domDom, maskIds, reactDom, svelteDom } from '../../parity';
import { instances, type Fixtures } from '../../fixtures';
import { domParts } from './domComponents';
import { reactComponent } from './reactComponents';
import { svelteComponent } from './svelteComponents';
import { Hole, Opaque } from '../../primitives/Surface/Surface';
import { Icon } from '../../primitives/Icon/Icon';
import HoleSvelte from '../../primitives/Hole/Hole.svelte';
import OpaqueSvelte from '../../primitives/Opaque/Opaque.svelte';
import IconSvelte from '../../primitives/Icon/Icon.svelte';
import { VoteControl } from '../../components/VoteControl/VoteControl';
import VoteControlSvelte from '../../components/VoteControl/VoteControl.svelte';
import { actionButtonStories } from '../../components/ActionButton/ActionButton.fixtures';
import { buttonStories } from '../../components/Button/Button.fixtures';
import { checkboxStories } from '../../components/Checkbox/Checkbox.fixtures';
import { codeImageStories } from '../../components/CodeImage/CodeImage.fixtures';
import { disclosureStories } from '../../components/Disclosure/Disclosure.fixtures';
import { folderListStories } from '../../components/FolderList/FolderList.fixtures';
import { lampButtonStories } from '../../components/LampButton/LampButton.fixtures';
import { lineSliderStories } from '../../components/LineSlider/LineSlider.fixtures';
import { modalStories, sheetStories } from '../../components/Modal/Modal.fixtures';
import { numberFieldStories } from '../../components/NumberField/NumberField.fixtures';
import { pageListStories } from '../../components/PageList/PageList.fixtures';
import { popoverStories } from '../../components/Popover/Popover.fixtures';
import { radioStories } from '../../components/Radio/Radio.fixtures';
import { readoutStories } from '../../components/Readout/Readout.fixtures';
import { searchFieldStories } from '../../components/SearchField/SearchField.fixtures';
import { segmentedStories } from '../../components/Segmented/Segmented.fixtures';
import { selectStories } from '../../components/Select/Select.fixtures';
import { separatorStories } from '../../components/Separator/Separator.fixtures';
import { settingsRowStories } from '../../components/SettingsRow/SettingsRow.fixtures';
import { sliderStories } from '../../components/Slider/Slider.fixtures';
import { statusDotStories } from '../../components/StatusDot/StatusDot.fixtures';
import { stepValueStories } from '../../components/StepValue/StepValue.fixtures';
import { switchStories, toggleStories } from '../../components/Toggle/Toggle.fixtures';
import { voteControlStories } from '../../components/VoteControl/VoteControl.fixtures';
import { groupStories } from '../../layouts/Group/Group.fixtures';
import { holeStories, layerStories, opaqueStories } from '../../layouts/Layer/Layer.fixtures';
import { tabsStories } from '../../layouts/Tabs/Tabs.fixtures';
import { iconStories } from '../../primitives/Icon/Icon.fixtures';
import { stackStories } from '../../primitives/Stack/Stack.fixtures';
import { surfaceStories } from '../../primitives/Surface/Surface.fixtures';
import { textStories } from '../../primitives/Text/Text.fixtures';

/** Each part's fixtures, or null for a part with no fixtures of its own (drawn by another's). */
const PARTS: Record<string, Fixtures<any> | null> = {
  ActionButton: actionButtonStories,
  Button: buttonStories,
  Checkbox: checkboxStories,
  CodeImage: codeImageStories,
  Disclosure: disclosureStories,
  FolderList: folderListStories,
  // Gate and NamePicker keep their fixtures in their stories; their trees draw Surface, Button and SearchField, held here.
  Gate: null,
  NamePicker: null,
  LampButton: lampButtonStories,
  LineSlider: lineSliderStories,
  Modal: modalStories,
  Sheet: sheetStories,
  NumberField: numberFieldStories,
  PageList: pageListStories,
  Popover: popoverStories,
  Radio: radioStories,
  Readout: readoutStories,
  SearchField: searchFieldStories,
  Segmented: segmentedStories,
  Select: selectStories,
  Separator: separatorStories,
  SettingsRow: settingsRowStories,
  Slider: sliderStories,
  StatusDot: statusDotStories,
  StepValue: stepValueStories,
  Toggle: toggleStories,
  Switch: switchStories,
  VoteControl: voteControlStories,
  Group: groupStories,
  Layer: layerStories,
  Tabs: tabsStories,
  Hole: holeStories,
  Icon: iconStories,
  Opaque: opaqueStories,
  Stack: stackStories,
  Surface: surfaceStories,
  Text: textStories,
};

/** The parts neither registry holds by name (a binding draws them directly). */
const DIRECT: Record<string, [ComponentType<any>, unknown]> = { Hole: [Hole, HoleSvelte], Opaque: [Opaque, OpaqueSvelte], Icon: [Icon, IconSvelte], VoteControl: [VoteControl, VoteControlSvelte] };

/** Generated ids masked, and VoteControl's own (`lib-vote-<n>`, a count of the controls made so far). */
const mask = (dom: string) => maskIds(dom).replace(/lib-vote-\d+/g, 'lib-vote-n');

describe('the DOM renderer draws every part as React and Svelte do', () => {
  it('every part it draws is held here', () => {
    expect(Object.keys(PARTS).sort()).toEqual(Object.keys(domParts()).sort());
  });
  for (const [name, fixtures] of Object.entries(PARTS)) {
    if (!fixtures) continue;
    describe(name, () => {
      const [react, svelte] = DIRECT[name] ?? [reactComponent(name), svelteComponent(name)];
      for (const [story, fixture] of Object.entries(fixtures)) {
        const all = instances(fixture);
        all.forEach((props, i) => {
          it(all.length > 1 ? `${story} #${i + 1}` : story, () => {
            const expected = mask(reactDom(react, props));
            expect(expected).not.toBe('');
            expect(mask(svelteDom(svelte, props))).toBe(expected);
            expect(mask(domDom(name, props))).toBe(expected);
          });
        });
      }
    });
  }
});
