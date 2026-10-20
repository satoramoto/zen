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
snapshot('Region', (props) => regionView(props as RegionDrawProps, {}, { uid: 'uid' }), regionStories);
// A composite: Regions holding Groups of Buttons, and Regions with views (Tabs by name).
snapshot('Region sample', (props) => regionSample(props as RegionSampleArgs), regionSampleStories);
snapshot('Group', (props) => groupView(props as GroupDrawProps), groupStories);
snapshot('Group sample', (props) => groupSample(props as GroupSampleArgs), groupSampleStories);
snapshot('Layer', (props) => layerView(props as LayerViewProps), layerStories);
snapshot('Screen', (props) => screenView(props, props), screenStories);
snapshot('Screen (assembled)', (props) => screenView(props), assemblyStories);
snapshot('Screen sample', (args: Partial<ScreenArgs>) => screenSample({ ...screenArgs, ...args }),{ Default: { args: screenStoryArgs.Default }, GridOnly: { args: screenStoryArgs.GridOnly } });
snapshot('AssembledScreen', (props) => assembledScreenView(props, assembledPlacement(props, { room: null, principles: scopePrinciples(null) })), assemblyStories as Fixtures<Parameters<typeof assembledScreenView>[0]>);