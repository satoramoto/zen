// Every part the DOM renderer draws (`domComponents.ts`), with its fixtures (`<Name>.fixtures.ts`):
// what `dom.parity.test.tsx` and the DOM renderer's stories draw in all three renderers. Plain
// data, no renderer. One line per part, as `domComponents.ts` has one.
import type { Fixtures } from '../../fixtures';
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
export const DOM_FIXTURES: Record<string, Fixtures<any> | null> = {
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

