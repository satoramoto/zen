import type {Meta,StoryObj} from '@storybook/react-vite';
import {withLibraryTheme} from '../../storybook';
import {PrimeCounting} from './ZetaFoundations';
const meta={title:'Design OS/Math/Prime Counting',component:PrimeCounting,decorators:[withLibraryTheme],parameters:{layout:'fullscreen'},} satisfies Meta<typeof PrimeCounting>;
export default meta;type Story=StoryObj<typeof meta>;
export const PrimeCount:Story={};
