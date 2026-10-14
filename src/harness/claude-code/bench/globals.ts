// The kit and the mods compile against a global `h` and `Fragment`, as in the engine
// (engine.d.ts). Importing this puts the bench's on globalThis; import it before
// anything that draws (show.ts does, and zen's .storybook/preview.ts).

import { Fragment, h } from './render'

const g = globalThis as { h?: unknown; Fragment?: unknown }
g.h = h
g.Fragment = Fragment
