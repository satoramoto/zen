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
import { knobView } from '../components/music/Knob/Knob.model';
import { knobStories } from '../components/music/Knob/Knob.fixtures';
import { lampButtonView } from '../components/core/LampButton/LampButton.model';
import { lampButtonStories } from '../components/core/LampButton/LampButton.fixtures';
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

/** A primitive fixture's text children, as the tree builders take them. */
const kids = (props: unknown): string[] => {
  const children = (props as { children?: unknown }).children;
  return typeof children === 'string' ? [children] : [];
};

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
snapshot('Knob', (props) => knobView(props as Parameters<typeof knobView>[0]), knobStories);
snapshot('LampButton', (props) => lampButtonView(props as Parameters<typeof lampButtonView>[0]), lampButtonStories);
snapshot('SettingsRow', (props) => settingsRowView(props as Parameters<typeof settingsRowView>[0], 'uid'), settingsRowStories);
// A composite: SettingsRow holding a LampButton (component nodes, a callback by key, a filled slot).
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
snapshot('Tabs', (props) => tabsView(props), tabsStories);
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
