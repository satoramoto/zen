// The React side of the component registry: every component a tree can draw by name
// (`component('LampButton', …)`), as its React component. `svelteComponents.ts` is the Svelte side,
// with the same names; a model names a component and never imports a renderer. One line per
// component in each. The map is built on first use, so the import cycle (a registered component
// draws a `Tree`, which reads this) never sees a half-loaded module.
import type { ComponentType } from 'react';
import { Button } from '../components/core/Button/Button';
import { LampButton } from '../components/core/LampButton/LampButton';
import { LineSlider } from '../components/core/LineSlider/LineSlider';
import { Separator } from '../components/core/Separator/Separator';
import { SettingsRow } from '../components/core/SettingsRow/SettingsRow';
import { StatusDot } from '../components/core/StatusDot/StatusDot';
import { Knob } from '../components/music/Knob/Knob';
import { Tabs } from '../layout/Tabs';
import { Stack } from '../primitives/Stack';
import { Text } from '../primitives/Text';
import { Region } from '../layout/Region';
import { Group } from '../layout/Group';
import { Layer } from '../layout/Layer';
import { Screen } from '../layout/Screen';
import { SlotCall } from '../layout/SlotCall';
import { Surface } from '../primitives/Surface';
import { AssembledScreen } from '../layout/assembly/AssembledScreen';
import { FormProvider as FormScope } from '../layout/assembly/forms';
import { HealthSlot } from '../yahaha/HealthSlot/HealthSlot';
import { MetronomePopover } from '../yahaha/AppBar/MetronomePopover';
import { ChordReadout } from '../components/music/ChordReadout/ChordReadout';
import { TempoReadout } from '../components/music/TempoReadout/TempoReadout';

let registry: Record<string, ComponentType<any>> | undefined;

/** The React component registered as `name`; throws for an unknown name. */
export function reactComponent(name: string): ComponentType<any> {
  registry ??= { Button, Knob, LampButton, LineSlider, Separator, SettingsRow, Stack, StatusDot, Tabs, Text, HealthSlot, MetronomePopover, ChordReadout, TempoReadout, AssembledScreen, FormScope, Group, Layer, Region, Screen, SlotCall, Surface };
  const found = registry[name];
  if (!found) throw new Error(`view: no component named "${name}" (register it in src/library/view/reactComponents.ts and svelteComponents.ts)`);
  return found;
}
