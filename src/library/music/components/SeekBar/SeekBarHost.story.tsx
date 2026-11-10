import { useState } from 'react';
import { SeekBar, type SeekBarProps } from './SeekBar';

/** Story-only host: exercise prop updates without restarting Storybook's play phase. */
export function SeekBarHost(props: SeekBarProps) {
  const [position, setPosition] = useState(props.position);
  return <div>
    <SeekBar {...props} position={position} />
    <button type="button" onClick={() => setPosition(35)}>Update host position</button>
  </div>;
}
