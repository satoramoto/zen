import type {Meta,StoryObj} from '@storybook/react-vite';
import {withLibraryTheme} from '../../storybook';
import {ComplexSeries} from './ZetaFoundations';
const meta={title:'Design OS/Math/Complex Series',component:ComplexSeries,decorators:[withLibraryTheme],parameters:{layout:'fullscreen'},} satisfies Meta<typeof ComplexSeries>;
export default meta;type Story=StoryObj<typeof meta>;
export const PhasorSeries:Story={};
