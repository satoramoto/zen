// Story-only CSS boundary: the theme still comes from Zen's normal toolbar and ThemeScope.
import type { Decorator } from '@storybook/react-vite';
import './base.css';
import './preview.css';

/** Place inside withLibraryTheme: legacy variable names are scoped aliases, never a second theme. */
export const withMusicScope: Decorator = (Story, { parameters }) => (
  <div className="zen-music music-story-stage" data-music-stage={parameters.layout === 'fullscreen' ? 'screen' : 'specimen'} style={{ display: 'flow-root' }}>
    <Story />
  </div>
);
