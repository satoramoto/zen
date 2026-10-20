// The Svelte side of the component registry: every component a tree can draw by name, as its Svelte
// component, with the same names as `reactComponents.ts`. One line per component in each. Built on
// first use, as the React side is.
import type { Component } from 'svelte';
import Button from '../components/core/Button/Button.svelte';
import LampButton from '../components/core/LampButton/LampButton.svelte';
import LineSlider from '../components/core/LineSlider/LineSlider.svelte';
import Separator from '../components/core/Separator/Separator.svelte';
import SettingsRow from '../components/core/SettingsRow/SettingsRow.svelte';
import StatusDot from '../components/core/StatusDot/StatusDot.svelte';
import Knob from '../components/music/Knob/Knob.svelte';
import Tabs from '../layout/Tabs.svelte';
import Stack from '../primitives/Stack.svelte';
import Text from '../primitives/Text.svelte';
import Region from '../layout/Region.svelte';
import Group from '../layout/Group.svelte';
import Layer from '../layout/Layer.svelte';
import Screen from '../layout/Screen.svelte';
import AssembledScreen from '../layout/assembly/AssembledScreen.svelte';
import FormScope from '../layout/assembly/FormScope.svelte';

let registry: Record<string, Component<any>> | undefined;

/** The Svelte component registered as `name`; throws for an unknown name. */
export function svelteComponent(name: string): Component<any> {
  registry ??= { AssembledScreen, Button, FormScope, Group, Knob, LampButton, Layer, LineSlider, Region, Screen, Separator, SettingsRow, Stack, StatusDot, Tabs, Text } as Record<string, Component<any>>;
  const found = registry[name];
  if (!found) throw new Error(`view: no component named "${name}" (register it in src/library/view/reactComponents.ts and svelteComponents.ts)`);
  return found;
}
