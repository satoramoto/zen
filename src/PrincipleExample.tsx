import { useEffect, useId, useState } from "react";
import { bookFor, examples, type ExampleId } from "./catalog";
export type Voice = "editorial" | "everyday" | "technical";
export interface PrincipleExampleProps {
  id: ExampleId;
  applied?: boolean;
  measure?: number;
  hue?: number;
  voice?: Voice;
  width?: number;
}
function useLiveValue<T>(incoming: T) {
  const [value, setValue] = useState(incoming);
  useEffect(() => setValue(incoming), [incoming]);
  return [value, setValue] as const;
}
const fonts: Record<Voice, string> = {
  editorial: "Georgia, serif",
  everyday: "system-ui, sans-serif",
  technical: "ui-monospace, monospace",
};
const article =
  "At six each morning, the bakery opens its side door to the street. There is no sign, only the scent of bread and the sound of trays. Neighbors arrive with their own bags. Some stay for coffee; others carry breakfast home. Over time, this small daily exchange has become a kind of public life: familiar faces, a borrowed umbrella, news passed quietly across the counter. The room was never designed as a meeting place. It became one because people had a reason to return.";
const labels: Partial<Record<ExampleId, [string, string]>> = {
  T1: ["Studio-led", "Payment-led"],
  T3: ["Editorial cards", "Recurring roles"],
  G1: ["Inline times", "Shared time column"],
  G2: ["Equal columns", "Content-weighted"],
  G3: ["Local intervals", "Regular intervals"],
  R1: ["Even contrast", "Quieter context"],
  R2: ["Local spacing", "Shared scale"],
  R3: ["Shared interval", "Clear ownership"],
  W2: ["One family", "Complementary roles"],
  W3: ["Fixed composition", "Adaptive composition"],
  B1: ["Compact · 125%", "Open · 145%"],
  B2: ["Several highlights", "Action highlight"],
  B3: ["CMS defaults", "Editorial marks"],
};
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="demo-label">{children}</div>;
}
function ArticleText() {
  return (
    <>
      <p>{article}</p>
      <p>
        By noon the stools are empty again. A well-used room can be quiet, too.
      </p>
    </>
  );
}
function SettingsRows({ grouped = false }: { grouped?: boolean }) {
  return (
    <div className={`settings-rows ${grouped ? "grouped" : ""}`}>
      {["Cedar House", "North Studio", "River Market", "Eastside Museum"].map(
        (text, i) => (
          <div className="setting-row" key={text}>
            <div>
              <strong>{text}</strong>
              <small>
                {
                  [
                    "New comments and mentions",
                    "New comments and mentions",
                    "New comments and mentions",
                    "New comments and mentions",
                  ][i]
                }
              </small>
            </div>
            <span className="dummy-switch" aria-hidden="true" />
          </div>
        ),
      )}
    </div>
  );
}
export function PrincipleExample({
  id,
  applied,
  measure = 58,
  hue = 30,
  voice = "editorial",
  width = 520,
}: PrincipleExampleProps) {
  const e = examples[id];
  const [active, setActive] = useLiveValue(applied ?? e.defaultApplied);
  const [lineWidth, setLineWidth] = useLiveValue(measure);
  const [surroundHue, setSurroundHue] = useLiveValue(hue);
  const [family, setFamily] = useLiveValue(voice);
  const [previewWidth, setPreviewWidth] = useLiveValue(width);
  const inputId = useId();
  const headingId = useId();
  const ref = e.reference ?? bookFor(id).reference;
  const isColor = id.startsWith("C");
  let specimen;
  switch (id) {
    case "T1":
      specimen = (
        <div className={`demo-paper payment ${active ? "payment-led" : ""}`}>
          <div className="invoice-brand">
            NORTH
            <br />
            STUDIO
          </div>
          <SectionLabel>Invoice / 0248</SectionLabel>
          <div className="payment-total">$1,840.00</div>
          <div className="payment-date">Due 24 October</div>
          <div className="payment-rule" />
          <div className="demo-line">
            <span>Brand workshop</span>
            <span>$1,200.00</span>
          </div>
          <div className="demo-line">
            <span>Design consultation</span>
            <span>$640.00</span>
          </div>
          <div className="demo-line muted">
            <span>Billed to Cedar House</span>
            <span>Net 14</span>
          </div>
          <span className="demo-button">View payment options →</span>
        </div>
      );
      break;
    case "T2":
      specimen = (
        <div className="demo-paper reading-paper">
          <SectionLabel>Common ground / Dispatch 12</SectionLabel>
          <h4>The room around the bread</h4>
          <div className="reading" style={{ maxWidth: `${lineWidth}ch` }}>
            <ArticleText />
          </div>
          <span className="demo-foot">
            Same 16 px Georgia · 155% leading · width capped by the panel
          </span>
        </div>
      );
      break;
    case "T3":
      specimen = (
        <div className={`demo-paper queue ${active ? "systematic" : ""}`}>
          <SectionLabel>Your reading queue / 3 saved</SectionLabel>
          {[
            ["The room around the bread", "Essay", "8 min", "Maya Chen"],
            ["Who owns the sidewalk?", "Interview", "12 min", "Jon Bell"],
            ["A garden after dark", "Photo story", "4 min", "Alma Ortiz"],
          ].map(([title, kind, time, author], i) => (
            <div className={`queue-row row-${i}`} key={title}>
              <span className="queue-art" aria-hidden="true">
                {["◒", "╱", "✳"][i]}
              </span>
              <div>
                <small className="queue-kind">{kind}</small>
                <h4>{title}</h4>
                <div className="queue-meta">
                  <span>{author}</span>
                  <span>{time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
      break;
    case "G1":
      specimen = (
        <div className={`demo-paper agenda ${active ? "aligned" : ""}`}>
          <SectionLabel>Saturday / Design assembly</SectionLabel>
          <h4>Find your next conversation.</h4>
          {[
            ["9:30", "Opening conversation", "Main hall"],
            ["10:15–11:00", "Designing public spaces", "Studio 2"],
            ["11:30", "Materials and memory", "Main hall"],
          ].map(([time, title, room]) => (
            <div className="agenda-row" key={time}>
              <span className="agenda-time">{time}</span>
              <div>
                <strong>{title}</strong>
                <small>{room}</small>
              </div>
            </div>
          ))}
        </div>
      );
      break;
    case "G2":
      specimen = (
        <div className="demo-paper exhibition">
          <SectionLabel>Exhibition / 18 Oct–08 Dec</SectionLabel>
          <div
            className="exhibition-grid"
            style={{
              gridTemplateColumns: active
                ? "minmax(0,1.7fr) minmax(0,1fr)"
                : "minmax(0,1fr) minmax(0,1fr)",
            }}
          >
            <div>
              <h4>Objects that stay</h4>
              <p>
                Why do we keep an ordinary object for a lifetime? Twenty makers
                explore repair, memory, and the things that become part of a
                home.
              </p>
              <p>
                Visit the collection, then bring a small object to the Saturday
                repair table.
              </p>
            </div>
            <div className="exhibition-poster">
              <svg
                viewBox="0 0 180 210"
                role="img"
                aria-label="Original exhibition poster of a sculptural vessel"
              >
                <path
                  d="M55 48H125L115 110Q157 173 90 185Q23 173 65 110Z"
                  fill="#b66648"
                />
                <ellipse cx="90" cy="49" rx="35" ry="11" fill="#6c382b" />
                <path
                  d="M50 155Q90 169 130 155"
                  fill="none"
                  stroke="#e8b497"
                  strokeWidth="3"
                />
              </svg>
              <small>
                Gallery 04
                <br />
                Free admission
              </small>
            </div>
          </div>
        </div>
      );
      break;
    case "G3":
      specimen = (
        <div className="demo-paper">
          <SectionLabel>Notifications / Your projects</SectionLabel>
          <h4>Stay in the loop.</h4>
          <SettingsRows grouped={active} />
        </div>
      );
      break;
    case "C1":
      specimen = (
        <div className={`context-pair ${active ? "revealed" : ""}`}>
          <div className="perception-field gray-light">
            <span
              className="target-swatch"
              style={{ backgroundColor: "#929292" }}
            />
          </div>
          <div className="perception-field gray-dark">
            <span
              className="target-swatch"
              style={{ backgroundColor: "#929292" }}
            />
          </div>
          <div className="pair-caption">Same pixels: #929292 on both sides</div>
        </div>
      );
      break;
    case "C2":
      specimen = (
        <div className={`context-pair players ${active ? "revealed" : ""}`}>
          {["light", "dark"].map((theme) => (
            <div className={`music-context ${theme}`} key={theme}>
              <div className="context-furniture">
                <SectionLabel>STILL / Listening room</SectionLabel>
                <div className="album-art" aria-hidden="true">
                  ◒
                </div>
                <h4>After the rain</h4>
                <p>Nala Sine · 4:32</p>
              </div>
              <div
                className="target-swatch gold-progress"
                style={{ backgroundColor: "#d79b54" }}
              />
              <div
                className="context-furniture play-controls"
                aria-hidden="true"
              >
                ↤　Ⅱ　↦
              </div>
            </div>
          ))}
          <div className="pair-caption">
            Same progress bar: #D79B54 · same size
          </div>
        </div>
      );
      break;
    case "C3":
      specimen = (
        <div className={`context-pair ${active ? "revealed" : ""}`}>
          <div
            className="perception-field"
            style={{
              backgroundColor: active
                ? "#e5e5e5"
                : `hsl(${surroundHue} 42% 62%)`,
            }}
          >
            <span
              className="target-swatch"
              style={{ backgroundColor: "#9892a6" }}
            />
          </div>
          <div
            className="perception-field"
            style={{
              backgroundColor: active
                ? "#e5e5e5"
                : `hsl(${(surroundHue + 180) % 360} 42% 62%)`,
            }}
          >
            <span
              className="target-swatch"
              style={{ backgroundColor: "#9892a6" }}
            />
          </div>
          <div className="pair-caption">
            Same muted violet: #9892A6 · opposing surround hues
          </div>
        </div>
      );
      break;
    case "R1":
      specimen = (
        <div className={`demo-paper booking ${active ? "quiet" : ""}`}>
          <div className="booking-context">
            <SectionLabel>Your stay / Confirmation 8042</SectionLabel>
            <h4>Cedar House</h4>
            <div className="demo-line">
              <span>Portland, Oregon</span>
              <span>2 guests</span>
            </div>
          </div>
          <div className="booking-focus">
            <small>Check-in</small>
            <strong>Friday, 24 October</strong>
            <span>From 3:00 pm</span>
          </div>
          <div className="booking-context">
            <div className="demo-line">
              <span>2 nights · Garden room</span>
              <span>$420 total</span>
            </div>
            <div className="demo-line">
              <span>Host: Maya</span>
              <span>Contact host ↗</span>
            </div>
          </div>
        </div>
      );
      break;
    case "R2":
      specimen = (
        <div className={`demo-paper file-panel ${active ? "scale" : ""}`}>
          <SectionLabel>Project / Cedar House</SectionLabel>
          <div className="files-toolbar">
            <h4>Shared files</h4>
            <span className="tag">3 items</span>
          </div>
          {[
            ["Strategy.pdf", "Updated today", "1.4 MB"],
            ["Reference board", "Updated yesterday", "12 images"],
            ["Homepage.fig", "Updated 21 October", "8.2 MB"],
          ].map(([name, date, size], i) => (
            <div className={`file-item file-${i}`} key={name}>
              <span className="file-icon" aria-hidden="true">
                ▧
              </span>
              <div>
                <strong>{name}</strong>
                <small>{date}</small>
              </div>
              <span className="file-size">{size}</span>
            </div>
          ))}
          <div className="file-footer">
            Only people in this project can view these files.
          </div>
        </div>
      );
      break;
    case "R3":
      specimen = (
        <div className={`demo-paper security ${active ? "owned" : ""}`}>
          <SectionLabel>Preferences / Notifications</SectionLabel>
          <h4>Stay connected</h4>
          <div className="security-option">
            <strong>Email notifications</strong>
            <span className="tag">On</span>
          </div>
          <p className="security-help">Only mentions and direct messages.</p>
          <div className="security-option">
            <strong>Mobile notifications</strong>
            <span className="tag">On</span>
          </div>
          <p className="security-help">Delivered while you are away.</p>
          <div className="security-footer">Changes are saved automatically</div>
        </div>
      );
      break;
    case "W1":
      specimen = (
        <div className="demo-paper voice-poster">
          <SectionLabel>Eastside design museum / Autumn 2026</SectionLabel>
          <div className="voice-art" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h4 className="voice-title" style={{ fontFamily: fonts[family] }}>
            Objects
            <br />
            that stay
          </h4>
          <div className="demo-line">
            <span>Repair. Memory. Everyday life.</span>
            <span>18 Oct–08 Dec</span>
          </div>
        </div>
      );
      break;
    case "W2":
      specimen = (
        <div className="demo-paper journal">
          <div
            className="journal-nav"
            style={{ fontFamily: active ? fonts.everyday : fonts.editorial }}
          >
            <span>COMMON GROUND</span>
            <span>Essays　Places　About</span>
          </div>
          <SectionLabel>Dispatch 12 / Local life</SectionLabel>
          <h4>The room around the bread</h4>
          <p className="journal-deck">
            A bakery, a borrowed umbrella, and the small rituals that make a
            neighborhood.
          </p>
          <div className="journal-byline">Maya Chen · 8 minute read</div>
          <div className="journal-body">{article}</div>
        </div>
      );
      break;
    case "W3":
      specimen = (
        <div className="resize-stage">
          <div
            className="responsive-shell"
            style={{
              width: `${previewWidth}px`,
              maxWidth: "100%",
              containerType: "inline-size",
            }}
          >
            <div className={`adaptive-paper ${active ? "adaptive" : ""}`}>
              <SectionLabel>Common ground / Dispatch 12</SectionLabel>
              <h4>The room around the bread</h4>
              <p className="adaptive-deck">
                Small rituals make a neighborhood.
              </p>
              <div className="adaptive-body">{article}</div>
            </div>
          </div>
        </div>
      );
      break;
    case "B1":
      specimen = (
        <div className="demo-paper leading-paper">
          <SectionLabel>Essay / Local life</SectionLabel>
          <h4>A reason to return</h4>
          <div
            className="leading-text"
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 16,
              lineHeight: active ? 1.45 : 1.25,
              maxWidth: "62ch",
            }}
          >
            <ArticleText />
          </div>
        </div>
      );
      break;
    case "B2":
      specimen = (
        <div className={`demo-paper notice ${active ? "selective" : ""}`}>
          <SectionLabel>Travel / Before you arrive</SectionLabel>
          <h4>Your room is almost ready.</h4>
          <p>
            Check-in opens at{" "}
            <span className="optional-emphasis">3:00 pm on Friday.</span> You
            will find the key in the lockbox beside the blue door.
          </p>
          <p>
            <strong>Send your arrival time by Thursday.</strong> This helps Maya
            have everything ready for you.
          </p>
          <p>
            The access code appears in{" "}
            <span className="optional-emphasis">your booking details</span> on
            the morning of your stay.{" "}
            <span className="optional-emphasis">Parking is included</span> in
            the courtyard.
          </p>
          <span className="demo-button">Message Maya →</span>
        </div>
      );
      break;
    case "B3":
      specimen = (
        <div className="demo-paper editorial-invite">
          <SectionLabel>Eastside museum / In conversation</SectionLabel>
          <h4>
            {active
              ? "“Objects have afterlives.”"
              : '"Objects have afterlives."'}
          </h4>
          <p>
            {active
              ? "Join maker Ana Ruiz for a conversation about repair—it’s a way of seeing value in what we already own."
              : "Join maker Ana Ruiz for a conversation about repair - it's a way of seeing value in what we already own."}
          </p>
          <div className="invite-time">
            {active ? "Saturday, 2–4 pm" : "Saturday, 2-4 pm"}
          </div>
          <p>Bring one well-loved object.</p>
          <div
            className="punctuation-detail"
            aria-label="Magnified punctuation sample"
          >
            {active ? "“ ”　’　—　–" : '" "　\'　-　-'}
          </div>
        </div>
      );
      break;
  }
  return (
    <article
      className={`example example-${id} rebuilt`}
      data-example={id}
      data-applied={active}
      aria-labelledby={headingId}
    >
      <div className="example-brief">
        <div className="eyebrow">
          <span className="example-number">
            {String(Object.keys(examples).indexOf(id) + 1).padStart(2, "0")}
          </span>
          {e.topic}
          <span className="example-code">{id}</span>
        </div>
        <h3 id={headingId}>{e.title}</h3>
        <p className="axiom">{e.axiom}</p>
        <a
          className="reference-link"
          href={ref.url}
          target="_blank"
          rel="noreferrer"
        >
          {ref.label} ↗
        </a>
        {e.extraReference && (
          <a
            className="reference-link"
            href={e.extraReference.url}
            target="_blank"
            rel="noreferrer"
          >
            {e.extraReference.label} ↗
          </a>
        )}
      </div>
      <div className="experiment">
        <p className="reader-task">
          <span>{isColor ? "Predict, then reveal" : "Try this task"}</span>
          {e.task}
        </p>
        <div className="experiment-toolbar rebuilt-toolbar">
          {labels[id] && (
            <div
              className="comparison-control"
              role="group"
              aria-label="Compare compositions"
            >
              {labels[id]!.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={active === (index === 1)}
                  onClick={() => setActive(index === 1)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {isColor && (
            <label className="reveal-control">
              <input
                type="checkbox"
                checked={active}
                onChange={(event) => setActive(event.target.checked)}
              />{" "}
              Remove the context
            </label>
          )}
          {(id === "T2" || id === "C3" || id === "W3") && (
            <label className="range-control" htmlFor={inputId}>
              <span>
                {e.control}
                <output>
                  {id === "T2"
                    ? lineWidth
                    : id === "C3"
                      ? surroundHue
                      : previewWidth}
                  {id === "T2" ? " ch" : id === "C3" ? "°" : " px"}
                </output>
              </span>
              <input
                id={inputId}
                type="range"
                min={id === "T2" ? 44 : id === "C3" ? 0 : 280}
                max={id === "T2" ? 76 : id === "C3" ? 360 : 640}
                value={
                  id === "T2"
                    ? lineWidth
                    : id === "C3"
                      ? surroundHue
                      : previewWidth
                }
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (id === "T2") setLineWidth(value);
                  else if (id === "C3") setSurroundHue(value);
                  else setPreviewWidth(value);
                }}
              />
            </label>
          )}
          {id === "W1" && (
            <label className="select-control" htmlFor={inputId}>
              <span>Choose a voice</span>
              <select
                id={inputId}
                value={family}
                onChange={(event) => setFamily(event.target.value as Voice)}
              >
                <option value="editorial">Georgia · literary</option>
                <option value="everyday">System sans · civic</option>
                <option value="technical">Monospace · archival</option>
              </select>
            </label>
          )}
        </div>
        <div className="specimen-stage rebuilt-stage">{specimen}</div>
        <div className="teaching-notes">
          <p>
            <span>What changes</span>
            {e.note}
          </p>
          <p>
            <span>What to notice</span>
            {e.takeaway}
          </p>
        </div>
      </div>
    </article>
  );
}
