// The tree each converted component draws for every story's fixture, as text (`printTree`), one
// file per component in `__snapshots__/`. With `Tree.parity.test.tsx` proving both renderers draw
// any tree the same, this is a converted component's whole DOM check. One line per component:
// `snapshot('Name', (props) => nameView(props), nameStories)`. A changed tree shows as a diff;
// `npx vitest run src/library/view/snapshot.test.ts -u` records a deliberate change.
import { describe, expect, it } from 'vitest';
import { instances, type Fixtures } from '../fixtures';
import { h, printTree, type Node } from './Tree.model';
import { buttonView } from '../components/core/Button/Button.model';
import { buttonStories } from '../components/core/Button/Button.fixtures';
import { actionButtonView } from '../components/core/ActionButton/ActionButton.model';
import { actionButtonStories } from '../components/core/ActionButton/ActionButton.fixtures';
import { searchFieldView } from '../components/core/SearchField/SearchField.model';
import { searchFieldStories } from '../components/core/SearchField/SearchField.fixtures';
import { knobView } from '../components/music/Knob/Knob.model';
import { knobStories } from '../components/music/Knob/Knob.fixtures';
import { lampButtonView } from '../components/core/LampButton/LampButton.model';
import { lampButtonStories } from '../components/core/LampButton/LampButton.fixtures';
import { padView } from '../components/music/Pad/Pad.model';
import { padStories } from '../components/music/Pad/Pad.fixtures';
import { meterView } from '../components/music/Meter/Meter.model';
import { meterStories } from '../components/music/Meter/Meter.fixtures';
import { barBeatView } from '../components/music/BarBeat/BarBeat.model';
import { barBeatStories } from '../components/music/BarBeat/BarBeat.fixtures';
import { faderView } from '../components/music/Fader/Fader.model';
import { faderStories } from '../components/music/Fader/Fader.fixtures';
import { sendReadoutView } from '../components/music/SendReadout/SendReadout.model';
import { sendReadoutStories } from '../components/music/SendReadout/SendReadout.fixtures';
import { keysView } from '../components/music/Keys/Keys.model';
import { keysStories } from '../components/music/Keys/Keys.fixtures';
import { chordReadoutView, type ChordReadoutModelProps } from '../components/music/ChordReadout/ChordReadout.model';
import { chordReadoutStories } from '../components/music/ChordReadout/ChordReadout.fixtures';
import { partMarksView, type PartMarksModelProps } from '../components/music/PartMarks/PartMarks.model';
import { partMarksStories } from '../components/music/PartMarks/PartMarks.fixtures';
import { sectionNameView, type SectionNameModelProps } from '../components/music/SectionName/SectionName.model';
import { sectionNameStories } from '../components/music/SectionName/SectionName.fixtures';
import { tempoReadoutView } from '../components/music/TempoReadout/TempoReadout.model';
import { tempoReadoutStories } from '../components/music/TempoReadout/TempoReadout.fixtures';
import { barReadoutView } from '../components/music/BarReadout/BarReadout.model';
import { barReadoutStories } from '../components/music/BarReadout/BarReadout.fixtures';
import { soundCellView } from '../components/music/SoundCell/SoundCell.model';
import { soundCellStories } from '../components/music/SoundCell/SoundCell.fixtures';
import { rackCellView } from '../components/music/RackCell/RackCell.model';
import { rackCellStories } from '../components/music/RackCell/RackCell.fixtures';
import { settingsRowView } from '../components/core/SettingsRow/SettingsRow.model';
import { controlArgs, settingsRowSample, settingsRowStories, type SampleArgs } from '../components/core/SettingsRow/SettingsRow.fixtures';
import { accentBlockView } from '../yahaha/AccentBlock/AccentBlock.model';
import { accentBlockStories } from '../yahaha/AccentBlock/AccentBlock.fixtures';
import { waitingChipView } from '../yahaha/WaitingChip/WaitingChip.model';
import { waitingChipDrawn } from '../yahaha/WaitingChip/WaitingChip.fixtures';
import { statusLineView } from '../yahaha/StatusLine/StatusLine.model';
import { statusLineStories } from '../yahaha/StatusLine/StatusLine.fixtures';
import { displayArtView } from '../yahaha/DisplayArt/DisplayArt.model';
import { displayArtStories } from '../yahaha/DisplayArt/DisplayArt.fixtures';
import { hueLegendView } from '../yahaha/HueLegend/HueLegend.model';
import { hueLegendStories } from '../yahaha/HueLegend/HueLegend.fixtures';
import { oneTouchPickerView } from '../yahaha/OneTouchPicker/OneTouchPicker.model';
import { oneTouchPickerStories } from '../yahaha/OneTouchPicker/OneTouchPicker.fixtures';
import { healthSlotView } from '../yahaha/HealthSlot/HealthSlot.model';
import { healthSlotStories } from '../yahaha/HealthSlot/HealthSlot.fixtures';
import { appBarView } from '../yahaha/AppBar/AppBar.model';
import { metronomePopoverView } from '../yahaha/AppBar/MetronomePopover.model';
import { appBarStories, metronomePopoverStories } from '../yahaha/AppBar/AppBar.fixtures';
import { textNode } from '../primitives/Text.model';
import { textStories } from '../primitives/Text.fixtures';
import { stackNode } from '../primitives/Stack.model';
import { stackStories } from '../primitives/Stack.fixtures';
import { surfaceNode } from '../primitives/Surface.model';
import { surfaceStories } from '../primitives/Surface.fixtures';
import { iconNode } from '../primitives/Icon.model';
import { iconStories } from '../primitives/Icon.fixtures';
import { holeNode, opaqueNode } from '../primitives/Hole.model';
import { holeStories, opaqueStories } from '../layout/Layer.fixtures';
import { statusDotView } from '../components/core/StatusDot/StatusDot.model';
import { statusDotStories } from '../components/core/StatusDot/StatusDot.fixtures';
import { separatorView } from '../components/core/Separator/Separator.model';
import { separatorStories } from '../components/core/Separator/Separator.fixtures';
import { lineSliderView } from '../components/core/LineSlider/LineSlider.model';
import { lineSliderStories } from '../components/core/LineSlider/LineSlider.fixtures';
import { sliderView } from '../components/core/Slider/Slider.model';
import { sliderStories } from '../components/core/Slider/Slider.fixtures';
import { popoverView } from '../components/core/Popover/Popover.model';
import { popoverStories } from '../components/core/Popover/Popover.fixtures';
import { modalView, sheetView } from '../components/core/Modal/Modal.model';
import { modalSample, modalStories, sheetStories } from '../components/core/Modal/Modal.fixtures';
import { tabsView } from '../layout/Tabs.model';
import { tabsStories } from '../layout/Tabs.fixtures';
import { displayView } from '../yahaha/Display/Display.model';
import { displayStories } from '../yahaha/Display/Display.fixtures';
import { songFormView } from '../yahaha/SongForm/SongForm.model';
import { songFormStories } from '../yahaha/SongForm/SongForm.fixtures';
import { faderBankView, faderBankRegionView, type FaderBankModelProps } from '../yahaha/FaderBank/FaderBank.model';
import { faderBankStories } from '../yahaha/FaderBank/FaderBank.fixtures';
import { knobBankView, knobBankRegionView, type KnobBankRegionModelProps } from '../yahaha/KnobBank/KnobBank.model';
import { knobBankStories } from '../yahaha/KnobBank/KnobBank.fixtures';
import { padBankRegionView, padBankView, type PadBankProps, type PadBankRegionProps } from '../yahaha/PadBank/PadBank.model';
import { padBankStories } from '../yahaha/PadBank/PadBank.fixtures';
import { stageView } from '../yahaha/Stage/Stage.model';
import { stageStories } from '../yahaha/Stage/Stage.fixtures';
import { pageListView } from '../components/core/PageList/PageList.model';
import { pageListStories } from '../components/core/PageList/PageList.fixtures';
import { folderListView } from '../components/core/FolderList/FolderList.model';
import { folderListStories } from '../components/core/FolderList/FolderList.fixtures';

/** A primitive fixture's text children, as the tree builders take them. */
const kids = (props: unknown): string[] => {
  const children = (props as { children?: unknown }).children;
  return typeof children === 'string' ? [children] : [];
};

import { regionView, type RegionDrawProps } from '../layout/Region.model';
import { regionSample, regionSampleStories, regionStories, type RegionSampleArgs } from '../layout/Region.fixtures';
import { groupView, type GroupDrawProps } from '../layout/Group.model';
import { groupSample, groupSampleStories, groupStories, type GroupSampleArgs } from '../layout/Group.fixtures';
import { layerView, type LayerViewProps } from '../layout/Layer.model';
import { layerStories } from '../layout/Layer.fixtures';
import { screenView } from '../layout/Screen.model';
import { screenArgs, screenSample, screenStories, screenStoryArgs, type ScreenArgs } from '../layout/Screen.fixtures';
import { assembledPlacement, assembledScreenView } from '../layout/assembly/AssembledScreen.model';
import { assemblyStories } from '../layout/assembly/Assembly.fixtures';
import { scopePrinciples } from '../layout/assembly/principles';

function snapshot<P>(name: string, view: (props: P) => Node, fixtures: Fixtures<P>): void {
  describe(name, () => {
    it('draws the same tree for every fixture', async () => {
      const text = Object.entries(fixtures)
        .flatMap(([story, fixture]) => {
          const all = instances(fixture);
          return all.map((props, i) => `## ${story}${all.length > 1 ? ` #${i + 1}` : ''}\n${printTree(view(props as P))}`);
        })
        .join('\n\n');
      await expect(`${text}\n`).toMatchFileSnapshot(`__snapshots__/${name}.tree`);
    });
  });
}

snapshot('Button', (props) => buttonView(props), buttonStories);
snapshot('ActionButton', (props) => actionButtonView(props), actionButtonStories);
snapshot('SearchField', (props) => searchFieldView(props as Parameters<typeof searchFieldView>[0]), searchFieldStories);
snapshot('Knob', (props) => knobView(props as Parameters<typeof knobView>[0]), knobStories);
snapshot('LampButton', (props) => lampButtonView(props as Parameters<typeof lampButtonView>[0]), lampButtonStories);
snapshot('SettingsRow', (props) => settingsRowView(props as Parameters<typeof settingsRowView>[0], 'uid'), settingsRowStories);
// A composite: SettingsRow holding a LampButton (component nodes, a callback by key, a filled slot).
snapshot('Pad', (props) => padView(props as Parameters<typeof padView>[0]), padStories);
snapshot('Meter', (props) => meterView(props as Parameters<typeof meterView>[0]), meterStories);
snapshot('BarBeat', (props) => barBeatView(props), barBeatStories);
snapshot('Fader', (props) => faderView(props as Parameters<typeof faderView>[0]), faderStories);
snapshot('SendReadout', (props) => sendReadoutView(props as Parameters<typeof sendReadoutView>[0]), sendReadoutStories);
snapshot('Keys', (props) => keysView(props as Parameters<typeof keysView>[0]), keysStories);
snapshot('ChordReadout', (props) => chordReadoutView(props as ChordReadoutModelProps), chordReadoutStories);
snapshot('PartMarks', (props) => partMarksView(props as PartMarksModelProps)!, partMarksStories);
snapshot('SectionName', (props) => sectionNameView(props as SectionNameModelProps), sectionNameStories);
snapshot('TempoReadout', (props) => tempoReadoutView(props as Parameters<typeof tempoReadoutView>[0]), tempoReadoutStories);
snapshot('BarReadout', (props) => barReadoutView(props as Parameters<typeof barReadoutView>[0]), barReadoutStories);
snapshot('SoundCell', (props) => soundCellView(props as Parameters<typeof soundCellView>[0]), soundCellStories);
snapshot('RackCell', (props) => rackCellView(props as Parameters<typeof rackCellView>[0]), rackCellStories);
snapshot('SettingsRow sample', (props) => settingsRowSample({ ...controlArgs, ...props } as SampleArgs), settingsRowStories);
snapshot('AccentBlock', (props) => accentBlockView(props as Parameters<typeof accentBlockView>[0]), accentBlockStories);
snapshot('WaitingChip', (props) => waitingChipView(props as Parameters<typeof waitingChipView>[0])!, waitingChipDrawn);
snapshot('StatusLine', (props) => statusLineView(props), statusLineStories);
snapshot('DisplayArt', (props) => displayArtView(props), displayArtStories);
snapshot('HueLegend', (props) => hueLegendView(props), hueLegendStories);
// OneTouchPicker draws several roots in its `cells` mode (one `Tree` each); printed under a `#roots` marker.
snapshot('OneTouchPicker', (props) => h('#roots', {}, ...oneTouchPickerView(props)), oneTouchPickerStories);
snapshot('HealthSlot', (props) => healthSlotView(props), healthSlotStories);
snapshot('AppBar', (props) => appBarView(props), appBarStories);
snapshot('MetronomePopover', (props) => metronomePopoverView(props), metronomePopoverStories);
// The primitives' tree builders (their components stay polymorphic bindings, held by parity.test.tsx).
snapshot('Text', (props) => textNode(props as Parameters<typeof textNode>[0], {}, ...kids(props)), textStories);
snapshot('Stack', (props) => stackNode(props as Parameters<typeof stackNode>[0], {}, ...kids(props)), stackStories);
snapshot('Surface', (props) => surfaceNode(props as Parameters<typeof surfaceNode>[0], {}, ...kids(props)), surfaceStories);
snapshot('Icon', (props) => iconNode(props as Parameters<typeof iconNode>[0], {}, ...kids(props)), iconStories);
snapshot('Opaque', (props) => opaqueNode(undefined, {}, ...kids(props)), opaqueStories);
snapshot('Hole', (props) => holeNode(undefined, (props as { name?: string }).name, {}, ...kids(props)), holeStories);
snapshot('StatusDot', (props) => statusDotView(props), statusDotStories);
snapshot('Separator', (props) => separatorView(props), separatorStories);
snapshot('LineSlider', (props) => lineSliderView(props as Parameters<typeof lineSliderView>[0]), lineSliderStories);
snapshot('Slider', (props) => sliderView(props as Parameters<typeof sliderView>[0]), sliderStories);
snapshot('Popover', (props) => popoverView(props), popoverStories);
snapshot('Modal', (props) => modalView(props as Parameters<typeof modalView>[0]), modalStories);
// A composite: a Modal holding action buttons in its `actions` slot.
snapshot('Modal sample', (props) => modalSample(props), { WithActions: modalStories.WithActions });
snapshot('Sheet', (props) => sheetView(props as Parameters<typeof sheetView>[0]), sheetStories);
snapshot('Tabs', (props) => tabsView(props), tabsStories);
snapshot('Region',(props) => regionView(props as RegionDrawProps, {}, { uid: 'uid' }), regionStories);
// A composite: Regions holding Groups of Buttons, and Regions with views (Tabs by name).
snapshot('Region sample', (props) => regionSample(props as RegionSampleArgs), regionSampleStories);
snapshot('Group', (props) => groupView(props as GroupDrawProps), groupStories);
snapshot('Group sample', (props) => groupSample(props as GroupSampleArgs), groupSampleStories);
snapshot('Layer', (props) => layerView(props as LayerViewProps), layerStories);
snapshot('Screen', (props) => screenView(props, props), screenStories);
snapshot('Screen (assembled)', (props) => screenView(props), assemblyStories);
snapshot('Screen sample', (args: Partial<ScreenArgs>) => screenSample({ ...screenArgs, ...args }),{ Default: { args: screenStoryArgs.Default }, GridOnly: { args: screenStoryArgs.GridOnly } });
snapshot('AssembledScreen', (props) => assembledScreenView(props, assembledPlacement(props, { room: null, principles: scopePrinciples(null) })), assemblyStories as Fixtures<Parameters<typeof assembledScreenView>[0]>);
snapshot('Display', (props) => displayView(props as Parameters<typeof displayView>[0], { fromScreen: props.form ?? 'compact', chosen: null }, false), displayStories);
snapshot('SongForm', (props) => songFormView(props, props.formForm ?? 'strip', props.transportForm ?? 'keys'), songFormStories);
snapshot('FaderBank', (props) => faderBankView(props as FaderBankModelProps, (props as FaderBankModelProps).form ?? 'tall'), faderBankStories);
// The region composites' roots are component nodes (a Region holding the bank).
snapshot('FaderBankRegion', (props) => faderBankRegionView(props as Parameters<typeof faderBankRegionView>[0]) as unknown as Node, faderBankStories);
snapshot('KnobBank', (props) => knobBankView(props as KnobBankRegionModelProps, (props as KnobBankRegionModelProps).form ?? 'labelled'), knobBankStories);
snapshot('KnobBankRegion', (props) => knobBankRegionView(props as KnobBankRegionModelProps) as unknown as Node, knobBankStories);
snapshot('PadBank', (props) => padBankView(props as PadBankProps, (props as PadBankProps).form ?? 'two-rows', null), padBankStories);
snapshot('PadBankRegion', (props) => padBankRegionView(props as PadBankRegionProps) as unknown as Node, padBankStories);
// The Stage's target tree (the Screen with its regions as slots); its bindings still draw the Screen by hand until the layout lane's Screen takes region slots.
snapshot('Stage', (props) => stageView(props, {}, { left: 0, right: 0 }), stageStories);
snapshot('PageList', (props) => pageListView(props as Parameters<typeof pageListView>[0]), pageListStories);
snapshot('FolderList', (props) => folderListView(props as Parameters<typeof folderListView>[0]), folderListStories);
