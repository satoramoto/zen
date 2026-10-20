// DOM parity: every component's React and Svelte renderers draw the same DOM for every story's
// fixture (parity.ts). One line per component: `parity(name, ReactComponent, SvelteComponent, fixtures)`.
import { parity } from './parity';
import { Text } from './primitives/Text';
import TextSvelte from './primitives/Text.svelte';
import { textStories } from './primitives/Text.fixtures';
import { Stack } from './primitives/Stack';
import StackSvelte from './primitives/Stack.svelte';
import { stackStories } from './primitives/Stack.fixtures';
import { Button } from './components/core/Button/Button';
import ButtonSvelte from './components/core/Button/Button.svelte';
import { buttonStories } from './components/core/Button/Button.fixtures';

parity('Text', Text, TextSvelte, textStories);
parity('Stack', Stack, StackSvelte, stackStories);
parity('Button', Button, ButtonSvelte, buttonStories);
