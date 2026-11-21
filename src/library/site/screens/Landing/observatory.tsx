import { useState } from 'react';

/** Modal-locked geometric glyph light sculpture: isometric open planes of tiny circles, hexagons and cross marks. */
function GlyphSculpture({ compact = false }: { compact?: boolean }) {
  const nodes: Array<{ x: number; y: number; kind: 'dot' | 'hex' | 'plus'; alpha: number; bright?: boolean }> = [];
  const planes = compact ? 2 : 3;
  for (let p = 0; p < planes; p++) {
    const ox = (p - (planes - 1) / 2) * 86;
    const oy = (p - (planes - 1) / 2) * 18;
    for (let row = -5; row <= 5; row++) {
      for (let col = -5; col <= 5; col++) {
        const edge = Math.abs(row) === 5 || Math.abs(col) === 5 || Math.abs(row + col) <= 1;
        if (!edge && (row + col + p) % 2 !== 0) continue;
        const x = 360 + ox + (col - row) * 18;
        const y = 175 + oy + (col + row) * 9;
        const bright = Math.abs(row) === 5 || (p === 1 && row === 0 && Math.abs(col) <= 2);
        const alpha = bright ? 0.95 : 0.22 + ((Math.abs(row * col + p) % 5) * 0.11);
        const kind = (row + col) % 3 === 0 ? 'hex' : (row - col) % 2 === 0 ? 'plus' : 'dot';
        nodes.push({ x, y, kind, alpha, bright });
      }
    }
  }
  return (
    <svg
      viewBox="0 0 720 350"
      width="100%"
      height={compact ? 220 : 320}
      aria-hidden="true"
      style={{ maxWidth: 760, display: 'block' }}
    >
      <defs>
        <radialGradient id="obs-glyph-fade" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#7fee64" stopOpacity="0.24" />
          <stop offset="65%" stopColor="#7fee64" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#040804" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="360" cy="175" rx="310" ry="135" fill="url(#obs-glyph-fade)" />
      {nodes.map((n, i) => {
        const color = n.bright ? '#7fee64' : '#a8aba6';
        if (n.kind === 'plus') {
          return (
            <path
              key={i}
              d={`M${n.x - 2.5} ${n.y}h5M${n.x} ${n.y - 2.5}v5`}
              stroke={color}
              strokeWidth="1.3"
              strokeOpacity={n.alpha}
            />
          );
        }
        if (n.kind === 'hex') {
          return (
            <polygon
              key={i}
              points={`${n.x},${n.y - 3} ${n.x + 2.6},${n.y - 1.5} ${n.x + 2.6},${n.y + 1.5} ${n.x},${n.y + 3} ${n.x - 2.6},${n.y + 1.5} ${n.x - 2.6},${n.y - 1.5}`}
              fill="none"
              stroke={color}
              strokeWidth="1.1"
              strokeOpacity={n.alpha}
            />
          );
        }
        return <circle key={i} cx={n.x} cy={n.y} r={n.bright ? 2.4 : 1.7} fill={color} fillOpacity={n.alpha} />;
      })}
    </svg>
  );
}

/** Minimal geometric wireframes for the 3-column technical triptych. */
function WireframeDiagram({ kind }: { kind: 'radial' | 'planes' | 'mesh' }) {
  if (kind === 'radial') {
    return (
      <svg viewBox="0 0 240 180" width="220" height="165" aria-hidden="true">
        <circle cx="120" cy="90" r="62" fill="none" stroke="rgba(227,229,225,0.35)" strokeWidth="1" />
        <circle cx="120" cy="90" r="34" fill="none" stroke="rgba(227,229,225,0.2)" strokeDasharray="3 3" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x2 = 120 + Math.cos(rad) * 62;
          const y2 = 90 + Math.sin(rad) * 62;
          return <line key={deg} x1="120" y1="90" x2={x2} y2={y2} stroke="rgba(227,229,225,0.28)" strokeWidth="1" />;
        })}
        <circle cx="120" cy="90" r="4" fill="#7fee64" />
        <circle cx="182" cy="90" r="3" fill="#7fee64" />
        <circle cx="76" cy="46" r="3" fill="#e3e5e1" />
      </svg>
    );
  }
  if (kind === 'planes') {
    return (
      <svg viewBox="0 0 240 180" width="220" height="165" aria-hidden="true">
        {[0, 28, 56].map((dy, idx) => (
          <polygon
            key={dy}
            points={`120,${30 + dy} 195,${60 + dy} 120,${90 + dy} 45,${60 + dy}`}
            fill="none"
            stroke={idx === 1 ? '#7fee64' : 'rgba(227,229,225,0.35)'}
            strokeWidth={idx === 1 ? '1.3' : '1'}
            strokeDasharray={idx === 2 ? '3 3' : undefined}
          />
        ))}
        <line x1="120" y1="30" x2="120" y2="146" stroke="rgba(227,229,225,0.2)" strokeDasharray="2 3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 240 180" width="220" height="165" aria-hidden="true">
      <polygon points="120,26 184,58 184,122 120,154 56,122 56,58" fill="none" stroke="rgba(227,229,225,0.38)" strokeWidth="1" />
      <polygon points="120,50 156,70 156,110 120,130 84,110 84,70" fill="none" stroke="rgba(227,229,225,0.22)" strokeDasharray="3 3" />
      <line x1="120" y1="26" x2="120" y2="154" stroke="rgba(227,229,225,0.22)" />
      <line x1="56" y1="58" x2="184" y2="122" stroke="rgba(227,229,225,0.22)" />
      <circle cx="120" cy="50" r="3.5" fill="#7fee64" />
      <circle cx="156" cy="110" r="3.5" fill="#7fee64" />
    </svg>
  );
}

const RATES = [
  { name: 'RTX 4090 slice', spec: '24 GB VRAM · CUDA / SPIR-V', perSecond: '$0.00011 / s', perMonth: '$0.39 / hr' },
  { name: 'H100 SXM node', spec: '80 GB HBM3 · NVLink mesh', perSecond: '$0.00058 / s', perMonth: '$2.08 / hr' },
  { name: 'WASM / V8 worker', spec: '1 vCPU · 512 MB · 0ms cold wake', perSecond: '$0.000004 / s', perMonth: '$5.00 / mo flat' },
  { name: 'Encrypted FUSE volume', spec: 'BLAKE3 chunked NVMe cache + R2', perSecond: '$0.00000001 / GB·s', perMonth: '$0.02 / GB·mo' },
];

export function ComputeObservatory() {
  const [billingUnit, setBillingUnit] = useState<'second' | 'hour'>('second');
  const [selectedSlice, setSelectedSlice] = useState(0);

  return (
    <div className="zen-lp zen-lp-obs">
      <div className="zen-lp-obs__announce">
        <span>Opal Fabric v0.4 — sub-100ms GPU preemption across 1,400+ spot nodes.</span>
        <a href="#rates">Read the wire spec →</a>
      </div>

      <div className="zen-lp-obs__nav-wrap">
        <div className="zen-lp-obs__container">
          <nav className="zen-lp-obs__nav" aria-label="Primary">
            <a className="zen-lp-obs__brand" href="#top">
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <polygon points="9,1 16,5 16,13 9,17 2,13 2,5" fill="none" stroke="#7fee64" strokeWidth="1.6" />
                <circle cx="9" cy="9" r="2.2" fill="#7fee64" />
              </svg>
              <span>opal fabric</span>
            </a>
            <ul className="zen-lp-obs__nav-links">
              <li><a href="#architecture">Architecture</a></li>
              <li><a href="#wire">Wire ABI</a></li>
              <li><a href="#rates">Rates</a></li>
              <li><a href="#proof">Benchmarks</a></li>
            </ul>
            <div className="zen-lp-obs__nav-actions">
              <a className="zen-lp-obs__btn zen-lp-obs__btn--secondary zen-lp-obs__btn--sm" href="#wire">Docs</a>
              <a className="zen-lp-obs__btn zen-lp-obs__btn--primary zen-lp-obs__btn--sm" href="#launch">Get started</a>
            </div>
          </nav>
        </div>
      </div>

      <header id="top" className="zen-lp-obs__hero">
        <div className="zen-lp-obs__container">
          <div className="zen-lp-obs__hero-copy">
            <h1 className="zen-lp-obs__display">
              One Unix command across{' '}
              <span className="zen-lp-obs__display-accent">every idle GPU</span>
            </h1>
            <p className="zen-lp-obs__hero-support">
              An atomic node harness exposes raw CUDA, Vulkan, and WASM execution over QUIC—preempting
              background filler in milliseconds with zero container pulls.
            </p>
            <div className="zen-lp-obs__hero-actions">
              <a className="zen-lp-obs__btn zen-lp-obs__btn--primary" href="#launch">Get started</a>
              <a className="zen-lp-obs__btn zen-lp-obs__btn--secondary" href="#wire">Inspect wire ABI</a>
            </div>
          </div>

          <div className="zen-lp-obs__sculpture-wrap">
            <GlyphSculpture />
          </div>

          <dl className="zen-lp-obs__trust">
            <div className="zen-lp-obs__trust-item">
              <dt>DISPATCH LATENCY</dt>
              <dd>42 ms</dd>
            </div>
            <div className="zen-lp-obs__trust-item">
              <dt>HARNESS BINARY</dt>
              <dd>11.4 MB</dd>
            </div>
            <div className="zen-lp-obs__trust-item">
              <dt>ACTIVE MESH</dt>
              <dd>1,480 GPUs</dd>
            </div>
            <div className="zen-lp-obs__trust-item">
              <dt>FLOOR SUBSIDY</dt>
              <dd>Priority 1</dd>
            </div>
          </dl>
        </div>
      </header>

      <section id="architecture" className="zen-lp-obs__band">
        <div className="zen-lp-obs__container">
          <span className="zen-lp-obs__eyebrow">
            <span className="zen-lp-obs__eyebrow-mark">◈</span>
            Atomic runtime
          </span>
          <h2 className="zen-lp-obs__heading">
            Compute graphs over QUIC, not container pulls over HTTP
          </h2>

          <div className="zen-lp-obs__triptych">
            <article className="zen-lp-obs__triptych-col">
              <span className="zen-lp-obs__mono">01 / HARNESS</span>
              <div className="zen-lp-obs__wireframe"><WireframeDiagram kind="radial" /></div>
              <div>
                <h3 className="zen-lp-obs__triptych-title">Driver-only binary</h3>
                <p className="zen-lp-obs__triptych-desc">
                  Loads libcuda.so.1 and libvulkan.so.1 at runtime with zero toolkit weight. One static binary runs across Vast, Salad, and owned metal.
                </p>
              </div>
            </article>
            <article className="zen-lp-obs__triptych-col">
              <span className="zen-lp-obs__mono">02 / PREEMPTION</span>
              <div className="zen-lp-obs__wireframe"><WireframeDiagram kind="planes" /></div>
              <div>
                <h3 className="zen-lp-obs__triptych-title">Always-warm spot arbitrage</h3>
                <p className="zen-lp-obs__triptych-desc">
                  Priority 1 filler keeps spot nodes profitable 24/7. Priority 0 workloads pause filler in under 100ms without dropping the lease.
                </p>
              </div>
            </article>
            <article className="zen-lp-obs__triptych-col">
              <span className="zen-lp-obs__mono">03 / STORAGE</span>
              <div className="zen-lp-obs__wireframe"><WireframeDiagram kind="mesh" /></div>
              <div>
                <h3 className="zen-lp-obs__triptych-title">Chunked lazy mounts</h3>
                <p className="zen-lp-obs__triptych-desc">
                  Client-encrypted 4 MB BLAKE3 chunks fetch on demand from R2 or regional peer caches and flush modified blocks on exit.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="wire" className="zen-lp-obs__split-section">
        <div className="zen-lp-obs__container">
          <div className="zen-lp-obs__split">
            <div>
              <span className="zen-lp-obs__eyebrow">
                <span className="zen-lp-obs__eyebrow-mark">⌘</span>
                Unix supercomputer
              </span>
              <h2 className="zen-lp-obs__heading">
                Pipe local stdin across a thousand remote cores
              </h2>
              <ul className="zen-lp-obs__benefit-list">
                <li className="zen-lp-obs__benefit-item">
                  <span className="zen-lp-obs__green-text">01</span>
                  <span><strong>No head-of-line stalls:</strong> QUIC separates control heartbeats, blob streams, and stdout pipes.</span>
                </li>
                <li className="zen-lp-obs__benefit-item">
                  <span className="zen-lp-obs__green-text">02</span>
                  <span><strong>Local-speed GPU loops:</strong> EXEC_GRAPH ships a DAG once so kernels loop at PCIe/VRAM speed.</span>
                </li>
                <li className="zen-lp-obs__benefit-item">
                  <span className="zen-lp-obs__green-text">03</span>
                  <span><strong>Plan 9 handles:</strong> Address GPUs, blobs, and stdio streams like ordinary Unix file descriptors.</span>
                </li>
              </ul>
            </div>

            <div className="zen-lp-obs__stage">
              <div className="zen-lp-obs__terminal-panel" role="region" aria-label="Wire session trace">
                <div className="zen-lp-obs__terminal-line">
                  <span className="zen-lp-obs__green-text">$ opal map --gpus 8x4090 --graph infer.spv &lt; prompts.jsonl</span>
                  <span>QUIC 0-RTT</span>
                </div>
                <div className="zen-lp-obs__terminal-line">
                  <span>PUT_BLOB blake3:9f82a1… (weights.safetensors)</span>
                  <span className="zen-lp-obs__green-text">cache HIT · 0 ms</span>
                </div>
                <div className="zen-lp-obs__terminal-line">
                  <span>PREEMPT priority=1 → priority=0</span>
                  <span>yielded in 38 ms</span>
                </div>
                <div className="zen-lp-obs__terminal-line">
                  <span>EXEC_GRAPH stream=3 · 8 nodes · 4096 batches</span>
                  <span className="zen-lp-obs__green-text">18.4 k tok/s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="rates" className="zen-lp-obs__band">
        <div className="zen-lp-obs__container">
          <div className="zen-lp-obs__rates-head">
            <div>
              <span className="zen-lp-obs__eyebrow">
                <span className="zen-lp-obs__eyebrow-mark">$</span>
                Transparent compute rates
              </span>
              <h2 className="zen-lp-obs__heading">Only pay when Priority 0 runs</h2>
            </div>
            <div className="zen-lp-obs__unit-toggle" role="group" aria-label="Rate billing unit">
              <button
                type="button"
                className="zen-lp-obs__unit-btn"
                aria-pressed={billingUnit === 'second'}
                onClick={() => setBillingUnit('second')}
              >
                Per second
              </button>
              <button
                type="button"
                className="zen-lp-obs__unit-btn"
                aria-pressed={billingUnit === 'hour'}
                onClick={() => setBillingUnit('hour')}
              >
                Hourly / flat
              </button>
            </div>
          </div>

          <div className="zen-lp-obs__rate-table">
            {RATES.map((row, idx) => (
              <div
                key={row.name}
                className="zen-lp-obs__rate-row"
                style={{ cursor: 'pointer', background: selectedSlice === idx ? 'rgba(127,238,100,0.05)' : undefined }}
                onClick={() => setSelectedSlice(idx)}
              >
                <div>
                  <div className="zen-lp-obs__rate-name">{row.name}</div>
                  <div className="zen-lp-obs__rate-meta">{row.spec}</div>
                </div>
                <div className="zen-lp-obs__rate-price">
                  {billingUnit === 'second' ? row.perSecond : row.perMonth}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="proof" className="zen-lp-obs__proof">
        <div className="zen-lp-obs__container">
          <div className="zen-lp-obs__quote-panel">
            <div>
              <blockquote className="zen-lp-obs__quote-text">
                “Replacing 9 GB container pulls with signed PTX and SPIR-V modules cut our fleet switchover from four minutes to forty milliseconds.”
              </blockquote>
              <p className="zen-lp-obs__quote-attr">
                Field note · Production fleet telemetry across Vast.ai &amp; Salad workers
              </p>
            </div>
            <svg viewBox="0 0 240 160" width="100%" height="140" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((r) =>
                [0, 1, 2, 3, 4, 5, 6].map((c) => (
                  <circle
                    key={`${r}-${c}`}
                    cx={26 + c * 32}
                    cy={22 + r * 28}
                    r={(r + c) % 4 === 0 ? 4 : 2}
                    fill={(r + c) % 5 === 0 ? '#124f11' : 'rgba(16,18,15,0.18)'}
                  />
                ))
              )}
            </svg>
          </div>

          <div className="zen-lp-obs__proof-tiles">
            <div className="zen-lp-obs__proof-tile">PTX / CUDA sm_80+</div>
            <div className="zen-lp-obs__proof-tile">SPIR-V Cooperative</div>
            <div className="zen-lp-obs__proof-tile">Wasmtime WASI</div>
            <div className="zen-lp-obs__proof-tile">QUIC + TLS/443</div>
          </div>
        </div>
      </section>

      <footer id="launch" className="zen-lp-obs__closing">
        <div className="zen-lp-obs__container">
          <div className="zen-lp-obs__closing-grid">
            <div>
              <h2 className="zen-lp-obs__display">
                Ship your first job{' '}
                <span className="zen-lp-obs__display-accent">in seconds</span>
              </h2>
              <div className="zen-lp-obs__hero-actions" style={{ justifyContent: 'flex-start' }}>
                <a className="zen-lp-obs__btn zen-lp-obs__btn--primary" href="#top">Deploy harness</a>
                <a className="zen-lp-obs__btn zen-lp-obs__btn--secondary" href="#wire">Read protocol</a>
              </div>
              <p className="zen-lp-obs__closing-note">
                Zero container tax · Outbound mTLS · Verified on live spot hardware
              </p>
            </div>
            <GlyphSculpture compact />
          </div>

          <div className="zen-lp-obs__footer">
            <div>
              <div className="zen-lp-obs__brand">opal fabric</div>
              <p className="zen-lp-obs__triptych-desc">
                Atomic spot compute and Unix dispatch over QUIC.
              </p>
            </div>
            <div>
              <h3>Runtime</h3>
              <ul>
                <li><a href="#architecture">Node harness</a></li>
                <li><a href="#wire">QUIC ABI</a></li>
                <li><a href="#rates">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3>Workloads</h3>
              <ul>
                <li><a href="#wire">Batch inference</a></li>
                <li><a href="#wire">ZK proving</a></li>
                <li><a href="#wire">WASM workers</a></li>
              </ul>
            </div>
            <div>
              <h3>Storage</h3>
              <ul>
                <li><a href="#architecture">BLAKE3 chunks</a></li>
                <li><a href="#architecture">SQLite WAL</a></li>
                <li><a href="#proof">Benchmarks</a></li>
              </ul>
            </div>
            <div>
              <h3>Company</h3>
              <ul>
                <li><a href="#top">Satoramoto</a></li>
                <li><a href="#proof">Status</a></li>
                <li><a href="#launch">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
