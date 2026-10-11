import { Badge, Button, Card, Field, Lamp, Pad, Readout, SectionHead, type Hue } from '../components';
import './screens.css';

// A compact arranger stage, after yahaha's Push "Stage" board: transport,
// sections, and one strip per keyboard part. Built only from library parts.

const PARTS: { name: string; voice: string; level: number; on: boolean; hue: Hue }[] = [
  { name: 'Right 1', voice: 'Grand Piano', level: -6, on: true, hue: 1 },
  { name: 'Right 2', voice: 'Strings', level: -12, on: true, hue: 2 },
  { name: 'Right 3', voice: 'Brass', level: -9, on: false, hue: 3 },
  { name: 'Left', voice: 'Strings', level: -10, on: true, hue: 4 },
];

const MAINS = ['Main A', 'Main B', 'Main C', 'Main D'];

export function ArrangerStage() {
  return (
    <div className="stage">
      <header className="stage__bar">
        <div className="lib-row">
          <Button variant="primary">Start</Button>
          <Button aria-pressed="true">Sync Start</Button>
          <Button variant="ghost">Tap</Button>
        </div>
        <div className="lib-row">
          <Readout value="112" unit="BPM" />
          <span className="lib-row stage__beats" aria-label="Beat 2 of 4">
            {[1, 2, 3, 4].map((b) => (
              <Lamp key={b} on={b <= 2} label={`Beat ${b}`} />
            ))}
          </span>
          <Readout small value="12·2" unit="bar·beat" />
        </div>
        <div className="stage__search">
          <Field label="Browse" placeholder="Find a style or song" />
        </div>
      </header>

      <section className="stage__display">
        <div className="lib-stack">
          <div>
            <div className="stage__eyebrow">Style</div>
            <div className="stage__title">Soul Ballad 2</div>
          </div>
          <div className="lib-row">
            <Badge>Chord · Cmaj7</Badge>
            <Badge>Fingering · AI Full</Badge>
            <Badge hue={1}>Reg 3 · Ballad</Badge>
          </div>
        </div>
        <div className="stage__sections">
          <SectionHead aside="2 bars left">Sections</SectionHead>
          <div className="stage__pads">
            <Pad>Intro I</Pad>
            {MAINS.map((m, i) => (
              <Pad key={m} state={i === 1 ? 'playing' : i === 2 ? 'queued' : 'idle'} flag={i === 2 ? 'Next' : undefined}>
                {m}
              </Pad>
            ))}
            <Pad>Ending I</Pad>
          </div>
        </div>
      </section>

      <section>
        <SectionHead aside="Launchkey page 1">Parts</SectionHead>
        <div className="stage__strips">
          {PARTS.map((p) => (
            <Card
              key={p.name}
              eyebrow={
                <span className="lib-row stage__strip-head" data-hue={p.hue}>
                  <span className="stage__part">{p.name}</span>
                  <Lamp on={p.on} hue={p.hue} label={p.on ? `${p.name} on` : `${p.name} off`} />
                </span>
              }
              title={p.voice}
            >
              <Readout small value={p.level} unit="dB" />
              <div className="lib-row">
                <Badge hue={p.hue}>REV 32</Badge>
                <Badge hue={p.hue}>DLY 8</Badge>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
