import { useState } from 'react';

const MESH_NODES = [
  { id: 'vast-iad-4090-01', gpu: 'RTX 4090 · 24 GB', quicRtt: '14 ms', prio: 'P0 · infer.spv', util: '94%', rate: '18.4 k tok/s' },
  { id: 'vast-fra-h100-07', gpu: 'H100 SXM · 80 GB', quicRtt: '22 ms', prio: 'P0 · zk-prove', util: '98%', rate: '41.2 k/s' },
  { id: 'salad-ord-3090-19', gpu: 'RTX 3090 · 24 GB', quicRtt: '19 ms', prio: 'P1 · jade-fill', util: '91%', rate: '44.7 TH/s' },
  { id: 'colo-sjc-395-02', gpu: 'Strix Halo · 128 GB', quicRtt: '8 ms', prio: 'P0 · wasm-wake', util: '12%', rate: '110 ms wake' },
];

/** Dense Modal-inspired glyph light field rendered inside the interactive workbench. */
function GlyphLattice({ compact = false, highlightIndex = 0 }: { compact?: boolean; highlightIndex?: number }) {
  const pts: Array<{ x: number; y: number; kind: 'dot' | 'hex' | 'plus'; alpha: number; lit: boolean }> = [];
  const planes = compact ? 2 : 3;
  for (let p = 0; p < planes; p++) {
    const ox = (p - (planes - 1) / 2) * 74;
    const oy = (p - (planes - 1) / 2) * 14;
    for (let r = -5; r <= 5; r++) {
      for (let c = -5; c <= 5; c++) {
        const edge = Math.abs(r) === 5 || Math.abs(c) === 5 || Math.abs(r + c) <= 1;
        if (!edge && (r + c + p) % 2 !== 0) continue;
        const x = 250 + ox + (c - r) * 14;
        const y = 128 + oy + (c + r) * 7.2;
        const lit = p === (highlightIndex % planes) && (Math.abs(r) === 5 || (r === 0 && Math.abs(c) <= 2));
        const alpha = lit ? 0.95 : 0.2 + ((Math.abs(r * c + p) % 5) * 0.12);
        const kind = (r + c) % 3 === 0 ? 'hex' : (r - c) % 2 === 0 ? 'plus' : 'dot';
        pts.push({ x, y, kind, alpha, lit });
      }
    }
  }
  return (
    <svg viewBox="0 0 500 256" width="100%" height={compact ? 190 : 230} aria-hidden="true" style={{ display: 'block' }}>
      <defs>
        <radialGradient id="obs-mesh-glow" cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#7fee64" stopOpacity="0.28" />
          <stop offset="65%" stopColor="#7fee64" stopOpacity="0.06" />
          <stop offset="100%" stopColor="#040804" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="250" cy="128" rx="220" ry="96" fill="url(#obs-mesh-glow)" />
      {pts.map((n, i) => {
        const color = n.lit ? '#7fee64' : '#9ea39b';
        if (n.kind === 'plus') {
          return (
            <path
              key={i}
              d={`M${n.x - 2.2} ${n.y}h4.4M${n.x} ${n.y - 2.2}v4.4`}
              stroke={color}
              strokeWidth="1.2"
              strokeOpacity={n.alpha}
            />
          );
        }
        if (n.kind === 'hex') {
          return (
            <polygon
              key={i}
              points={`${n.x},${n.y - 2.6} ${n.x + 2.2},${n.y - 1.3} ${n.x + 2.2},${n.y + 1.3} ${n.x},${n.y + 2.6} ${n.x - 2.2},${n.y + 1.3} ${n.x - 2.2},${n.y - 1.3}`}
              fill="none"
              stroke={color}
              strokeWidth="1"
              strokeOpacity={n.alpha}
            />
          );
        }
        return <circle key={i} cx={n.x} cy={n.y} r={n.lit ? 2.2 : 1.5} fill={color} fillOpacity={n.alpha} />;
      })}
    </svg>
  );
}

function WireframeDiagram({ kind }: { kind: 'radial' | 'planes' | 'mesh' }) {
  if (kind === 'radial') {
    return (
      <svg viewBox="0 0 240 170" width="210" height="150" aria-hidden="true">
        <circle cx="120" cy="85" r="58" fill="none" stroke="rgba(236,238,233,0.34)" strokeWidth="1" />
        <circle cx="120" cy="85" r="32" fill="none" stroke="rgba(236,238,233,0.18)" strokeDasharray="3 3" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          return (
            <line
              key={deg}
              x1="120"
              y1="85"
              x2={120 + Math.cos(rad) * 58}
              y2={85 + Math.sin(rad) * 58}
              stroke="rgba(236,238,233,0.24)"
              strokeWidth="1"
            />
          );
        })}
        <circle cx="120" cy="85" r="4" fill="#7fee64" />
        <circle cx="178" cy="85" r="3" fill="#7fee64" />
        <circle cx="79" cy="44" r="3" fill="#eceee9" />
      </svg>
    );
  }
  if (kind === 'planes') {
    return (
      <svg viewBox="0 0 240 170" width="210" height="150" aria-hidden="true">
        {[0, 26, 52].map((dy, idx) => (
          <polygon
            key={dy}
            points={`120,${26 + dy} 190,${54 + dy} 120,${82 + dy} 50,${54 + dy}`}
            fill="none"
            stroke={idx === 1 ? '#7fee64' : 'rgba(236,238,233,0.34)'}
            strokeWidth={idx === 1 ? '1.35' : '1'}
            strokeDasharray={idx === 2 ? '3 3' : undefined}
          />
        ))}
        <line x1="120" y1="26" x2="120" y2="134" stroke="rgba(236,238,233,0.2)" strokeDasharray="2 3" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 240 170" width="210" height="150" aria-hidden="true">
      <polygon points="120,22 182,53 182,117 120,148 58,117 58,53" fill="none" stroke="rgba(236,238,233,0.36)" strokeWidth="1" />
      <polygon points="120,46 154,65 154,105 120,124 86,105 86,65" fill="none" stroke="rgba(236,238,233,0.2)" strokeDasharray="3 3" />
      <line x1="120" y1="22" x2="120" y2="148" stroke="rgba(236,238,233,0.2)" />
      <line x1="58" y1="53" x2="182" y2="117" stroke="rgba(236,238,233,0.2)" />
      <circle cx="120" cy="46" r="3.5" fill="#7fee64" />
      <circle cx="154" cy="105" r="3.5" fill="#7fee64" />
    </svg>
  );
}

const RATES = [
  { name: 'RTX 4090 slice', spec: '24 GB VRAM · CUDA / SPIR-V', perSecond: '$0.00011 / s', perMonth: '$0.39 / hr' },
  { name: 'H100 SXM node', spec: '80 GB HBM3 · NVLink mesh', perSecond: '$0.00058 / s', perMonth: '$2.08 / hr' },
  { name: 'WASM / V8 worker', spec: '1 vCPU · 512 MB · 110ms wake', perSecond: '$0.000004 / s', perMonth: '$5.00 / mo flat' },
  { name: 'Encrypted FUSE volume', spec: 'BLAKE3 chunked NVMe cache + R2', perSecond: '$0.00000001 / GB·s', perMonth: '$0.02 / GB·mo' },
];

export function ComputeObservatory() {
  const [billingUnit, setBillingUnit] = useState<'second' | 'hour'>('second');
  const [selectedNode, setSelectedNode] = useState(0);
  const [selectedSlice, setSelectedSlice] = useState(0);

  const node = MESH_NODES[selectedNode];

  return (
    <div className="zen-lp zen-lp-obs">
      <div className="zen-lp-obs__announce">
        <span>Opal Fabric v0.4 — sub-100ms GPU preemption across 1,480 live spot nodes.</span>
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
            <div className="zen-lp-obs__hero-kicker">
              <span className="zen-lp-obs__pulse-dot" aria-hidden="true" />
              <span>QUIC WIRE MESH · 1,480 GPUs ONLINE</span>
            </div>
            <h1 className="zen-lp-obs__display">
              One Unix command across{' '}
              <span className="zen-lp-obs__display-accent">every idle GPU</span>
            </h1>
            <p className="zen-lp-obs__hero-support">
              An atomic 11 MB Rust harness exposes CUDA, Vulkan, and WASM execution over QUIC—preempting
              background filler in milliseconds with zero container pulls.
            </p>
            <div className="zen-lp-obs__hero-actions">
              <a className="zen-lp-obs__btn zen-lp-obs__btn--primary" href="#launch">Get started</a>
              <a className="zen-lp-obs__btn zen-lp-obs__btn--secondary" href="#wire">Inspect wire ABI</a>
            </div>
          </div>

          {/* Interactive Linear/Modal Workbench Stage fading into canvas */}
          <div className="zen-lp-obs__theater-wrap">
            <div className="zen-lp-obs__theater-glow" aria-hidden="true" />
            <div className="zen-lp-obs__workbench" role="region" aria-label="Live fleet workbench">
              <div className="zen-lp-obs__wb-bar">
                <div className="zen-lp-obs__wb-dots"><i /><i /><i /></div>
                <span>relay://iad-01.opal.run:443 · mTLS 0-RTT</span>
                <span className="zen-lp-obs__green-text">● {node.prio}</span>
              </div>
              <div className="zen-lp-obs__wb-body">
                <div className="zen-lp-obs__wb-rail">
                  <div className="zen-lp-obs__wb-rail-title">FLEET NODES</div>
                  {MESH_NODES.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      className="zen-lp-obs__wb-node"
                      aria-pressed={selectedNode === idx}
                      onClick={() => setSelectedNode(idx)}
                    >
                      <span>{item.id}</span>
                      <span className="zen-lp-obs__green-text">{item.quicRtt}</span>
                    </button>
                  ))}
                </div>
                <div className="zen-lp-obs__wb-center">
                  <GlyphLattice highlightIndex={selectedNode} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--obs-mono)', fontSize: 11.5, color: 'var(--obs-secondary)' }}>
                    <span>EXEC_GRAPH · stream #04</span>
                    <span>{node.gpu}</span>
                  </div>
                </div>
                <div className="zen-lp-obs__wb-inspector">
                  <div className="zen-lp-obs__wb-rail-title">LIVE TELEMETRY</div>
                  <div className="zen-lp-obs__wb-kv"><span>NODE</span><span>{node.id}</span></div>
                  <div className="zen-lp-obs__wb-kv"><span>HARDWARE</span><span>{node.gpu}</span></div>
                  <div className="zen-lp-obs__wb-kv"><span>PREEMPT SLOT</span><span className="zen-lp-obs__green-text">{node.prio}</span></div>
                  <div className="zen-lp-obs__wb-kv"><span>UTILIZATION</span><span>{node.util}</span></div>
                  <div className="zen-lp-obs__wb-kv"><span>THROUGHPUT</span><span className="zen-lp-obs__green-text">{node.rate}</span></div>
                </div>
              </div>
            </div>
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
                  Opens libcuda.so.1 and libvulkan.so.1 at runtime with zero toolkit weight across Vast, Salad, and owned metal.
                </p>
              </div>
            </article>
            <article className="zen-lp-obs__triptych-col">
              <span className="zen-lp-obs__mono">02 / PREEMPTION</span>
              <div className="zen-lp-obs__wireframe"><WireframeDiagram kind="planes" /></div>
              <div>
                <h3 className="zen-lp-obs__triptych-title">Always-warm spot arbitrage</h3>
                <p className="zen-lp-obs__triptych-desc">
                  Priority 1 filler covers spot rent 24/7. Priority 0 workloads pause filler in under 100ms without losing the lease.
                </p>
              </div>
            </article>
            <article className="zen-lp-obs__triptych-col">
              <span className="zen-lp-obs__mono">03 / STORAGE</span>
              <div className="zen-lp-obs__wireframe"><WireframeDiagram kind="mesh" /></div>
              <div>
                <h3 className="zen-lp-obs__triptych-title">Chunked lazy mounts</h3>
                <p className="zen-lp-obs__triptych-desc">
                  Client-encrypted 4 MB BLAKE3 chunks fetch on demand from R2 or peer caches and flush modified blocks on exit.
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
                  <span><strong>No head-of-line stalls:</strong> QUIC isolates control heartbeats, blob transfers, and stdout pipes.</span>
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
                style={{ cursor: 'pointer', background: selectedSlice === idx ? 'rgba(127,238,100,0.055)' : undefined }}
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
            <GlyphLattice compact />
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
