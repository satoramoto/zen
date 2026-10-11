import '@fontsource/dm-sans/200.css'
import '@fontsource/dm-sans/300.css'
import '@fontsource/dm-sans/400.css'
import '@fontsource/dm-sans/500.css'
import '@fontsource/dm-sans/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '../src/ui/tokens/index.css'

import { DecoratorHelpers } from '@storybook/addon-themes'
import type { Decorator, Preview } from '@storybook/svelte-vite'
import ThemeFrame from './ThemeFrame.svelte'
import { THEMES, asTheme, followGround } from './theme'

// The themes addon's toolbar (dark/light), without its decorator: that one sets the theme on the
// page's root element, which would theme Storybook's own UI and docs pages too.
DecoratorHelpers.initializeThemeState(Object.keys(THEMES), 'dark')

/** The Golden tunings (tokens/golden.css): the toolbar's choices. */
const TUNINGS = ['phi', 'just', 'root2']

/**
 * Wraps each story in an element carrying the toolbar's theme and Golden tuning; the tokens apply
 * under it. A story's `parameters.screen` sizes the screen tokens for it.
 */
const withTheme: Decorator = (_, context) => {
  const theme = asTheme(context.globals.theme)
  followGround(theme, context.globals.backgrounds)
  const tuning = TUNINGS.includes(context.globals.tuning) ? context.globals.tuning : 'phi'
  const { screen, sample } = context.parameters
  return { Component: ThemeFrame, props: { theme, tuning, screen, sample } }
}

const preview: Preview = {
  tags: ['autodocs'],
  decorators: [withTheme],
  globalTypes: {
    tuning: {
      description: 'Golden tuning: the shapes controls are drawn in',
      toolbar: {
        title: 'Tuning',
        icon: 'grid',
        items: [
          { value: 'phi', title: 'Phi' },
          { value: 'just', title: 'Just' },
          { value: 'root2', title: 'Root-two' },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    layout: 'centered',
    // The backgrounds tool sets the canvas; its options are the two themes' ground (--g), named
    // after the theme so the ground follows the theme until the user picks one (theme.ts).
    backgrounds: {
      options: {
        dark: { name: 'Dark ground', value: '#000000' },
        light: { name: 'Light ground', value: '#f2f1ee' },
      },
    },
    controls: { expanded: true },
    a11y: { test: 'error' },
  },
  initialGlobals: { theme: 'dark', tuning: 'phi' },
}

export default preview
