import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, Button, Card, Field, Lamp, Pad, Readout, SectionHead } from './components';
import { withLibraryTheme } from './storybook';

const meta: Meta = {
  title: 'Library/Components',
  decorators: [withLibraryTheme],
  parameters: { layout: 'fullscreen' },
};
export default meta;
type Story = StoryObj;

export const Buttons: Story = {
  render: () => (
    <div className="lib-row">
      <Button variant="primary">Start</Button>
      <Button>Sync Start</Button>
      <Button aria-pressed="true">Selected</Button>
      <Button variant="ghost">Tap</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
};

export const Fields: Story = {
  render: () => (
    <div className="lib-stack" style={{ maxWidth: 320 }}>
      <Field label="Search" placeholder="Find a style or song" />
      <Field label="Tempo" defaultValue="300" error="Tempo must be 5–280 BPM." />
    </div>
  ),
};

export const Cards: Story = {
  render: () => (
    <div className="lib-row" style={{ alignItems: 'stretch' }}>
      {(['Right 1', 'Left'] as const).map((name, i) => (
        <div key={name} style={{ width: 240 }}>
          <Card eyebrow={name} title={i ? 'Strings' : 'Grand Piano'}>
            <p className="lib-card__body">Layer with Right 2 for a fuller pad.</p>
            <Readout small value={-6} unit="dB" />
          </Card>
        </div>
      ))}
    </div>
  ),
};

export const Badges: Story = {
  render: () => (
    <div className="lib-row">
      <Badge>Neutral</Badge>
      <Badge hue={1}>Right 1</Badge>
      <Badge hue={2}>Right 2</Badge>
      <Badge hue={3}>Right 3</Badge>
      <Badge hue={4}>Left</Badge>
      <Badge hue={1} solid>
        Solid
      </Badge>
    </div>
  ),
};

export const LampsAndPads: Story = {
  render: () => (
    <div className="lib-stack" style={{ maxWidth: 520 }}>
      <SectionHead aside="beat 2 of 4">Lamps</SectionHead>
      <div className="lib-row">
        <Lamp on />
        <Lamp on hue={1} />
        <Lamp on hue={2} />
        <Lamp on hue={3} />
        <Lamp on hue={4} />
        <Lamp on={false} />
      </div>
      <SectionHead>Pads</SectionHead>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <Pad state="playing">Main A</Pad>
        <Pad state="queued" flag="Next">
          Main B
        </Pad>
        <Pad>Main C</Pad>
        <Pad state="playing" hue={2}>
          Pad 1
        </Pad>
      </div>
    </div>
  ),
};

export const Readouts: Story = {
  render: () => (
    <div className="lib-row" style={{ gap: 32 }}>
      <Readout value="112" unit="BPM" />
      <Readout value="12·2" unit="bar·beat" />
      <Readout small value={-6} unit="dB" />
    </div>
  ),
};
