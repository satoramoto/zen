import { useState, type FormEvent } from 'react';

const TEMPLATES = [
  {
    id: 'waitlist',
    label: 'Waitlist + Email',
    domain: 'nightowl.app',
    headline: 'Midnight coffee, delivered cold at 7am.',
    badge: 'SQLite WAL · 142 signups',
  },
  {
    id: 'studio',
    label: 'Product Drop',
    domain: 'monolith.studio',
    headline: 'Machined brass desk weights in batches of 50.',
    badge: 'Stripe Checkout · 110ms wake',
  },
  {
    id: 'api',
    label: 'Landing + AI API',
    domain: 'clipnotes.dev',
    headline: 'Turn voice memos into structured release notes.',
    badge: 'WASM + GPU endpoint',
  },
] as const;

export function StudioLaunchpad() {
  const [domainInput, setDomainInput] = useState('weekendcraft.com');
  const [checkedDomain, setCheckedDomain] = useState('weekendcraft.com');
  const [templateIndex, setTemplateIndex] = useState(0);

  const active = TEMPLATES[templateIndex];

  const onCheckDomain = (e: FormEvent) => {
    e.preventDefault();
    const clean = domainInput.trim().toLowerCase().replace(/[^a-z0-9.-]/g, '') || 'weekendcraft.com';
    setCheckedDomain(clean);
  };

  return (
    <div className="zen-lp zen-lp-studio">
      <div className="zen-lp-studio__rails">
        <nav className="zen-lp-studio__nav" aria-label="Primary">
          <a className="zen-lp-studio__brand" href="#studio-top">
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <rect x="2" y="2" width="16" height="16" rx="5" fill="#111318" />
              <circle cx="10" cy="10" r="3.2" fill="#ffffff" />
            </svg>
            <span>Shipyard</span>
          </a>
          <ul className="zen-lp-studio__nav-links">
            <li><a href="#machinery">Architecture</a></li>
            <li><a href="#proof-line">Benchmarks</a></li>
            <li><a href="#studio-launch">Pricing</a></li>
          </ul>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a className="zen-lp-studio__pill zen-lp-studio__pill--outline" href="#machinery">Live check</a>
            <a className="zen-lp-studio__pill zen-lp-studio__pill--black" href="#studio-launch">Launch idea</a>
          </div>
        </nav>

        {/* Stripe / Attio split hero with overlapping dual-card product theater */}
        <header id="studio-top" className="zen-lp-studio__hero">
          <div>
            <span className="zen-lp-studio__kicker">WASM + SQLITE WAL · $5/MO FLAT</span>
            <h1 className="zen-lp-studio__opening-title">
              Talk through an idea.{' '}
              <span className="zen-lp-studio__two-tone">Put it live in sixty seconds.</span>
            </h1>
            <p className="zen-lp-studio__hero-copy">
              A conversational builder drafts a Zen landing page, registers your .com on checkout, and wakes on HTTP in 110ms—with zero server config or surprise bills.
            </p>
            <div className="zen-lp-studio__actions">
              <a className="zen-lp-studio__pill zen-lp-studio__pill--black zen-lp-studio__pill--lg" href="#machinery">
                Try domain check
              </a>
              <a className="zen-lp-studio__pill zen-lp-studio__pill--outline zen-lp-studio__pill--lg" href="#studio-launch">
                $25 launch pack →
              </a>
            </div>
          </div>

          {/* Layered Stripe-style Product Theater */}
          <div className="zen-lp-studio__product-stage" aria-label="Chat to live site preview">
            <div className="zen-lp-studio__browser-card">
              <div className="zen-lp-studio__browser-bar">
                <span>https://{checkedDomain}</span>
                <span style={{ color: '#0070f3' }}>TLS · Let’s Encrypt</span>
              </div>
              <div className="zen-lp-studio__browser-split">
                <div className="zen-lp-studio__chat-pane">
                  <div style={{ fontFamily: 'var(--st-mono)', fontSize: 10.5, color: 'var(--st-support)' }}>
                    IDEA STUDIO
                  </div>
                  <div className="zen-lp-studio__bubble zen-lp-studio__bubble--user">
                    “I want a clean site for {checkedDomain} with a waitlist.”
                  </div>
                  <div className="zen-lp-studio__bubble zen-lp-studio__bubble--bot">
                    Drafted Zen hero + SQLite waitlist. {checkedDomain} is open. Launch it?
                  </div>
                </div>
                <div className="zen-lp-studio__preview-pane">
                  <div>
                    <div style={{ fontFamily: 'var(--st-mono)', fontSize: 10.5, color: 'var(--st-blue)' }}>
                      LIVE ARTIFACT
                    </div>
                    <div style={{ marginTop: 6, fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                      {active.headline}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ flex: 1, height: 30, borderRadius: 6, border: '1px solid var(--st-edge)', background: '#fafafa', paddingInline: 8, display: 'flex', alignItems: 'center', fontSize: 11, color: 'var(--st-support)' }}>
                      you@domain.com
                    </div>
                    <div style={{ height: 30, paddingInline: 12, borderRadius: 6, background: '#111318', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 500 }}>
                      Join
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="zen-lp-studio__checkout-pill-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>{checkedDomain}</span>
                <span style={{ fontFamily: 'var(--st-mono)', fontSize: 11, color: '#0070f3' }}>$25 today</span>
              </div>
              <div style={{ marginTop: 4, fontSize: 11.5, color: 'var(--st-support)' }}>
                1-yr domain + HTTPS + SQLite WAL · $5/mo after
              </div>
              <div style={{ marginTop: 10, height: 30, borderRadius: 7, background: '#111318', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 500 }}>
                Pay &amp; publish live
              </div>
            </div>
          </div>
        </header>

        {/* Vercel blueprint + soft machinery interactive controls */}
        <section id="machinery" className="zen-lp-studio__machinery">
          <div className="zen-lp-studio__section-head">
            <h2 className="zen-lp-studio__section-lead">
              Built like an instrument.{' '}
              <span className="zen-lp-studio__two-tone">Priced like a utility.</span>
            </h2>
            <span style={{ fontFamily: 'var(--st-mono)', fontSize: 12, color: 'var(--st-support)' }}>
              EDGE INGRESS · R2 SNAPSHOTS · WASM SANDBOX
            </span>
          </div>

          <div className="zen-lp-studio__machinery-grid">
            <article className="zen-lp-studio__soft-card zen-lp-studio__soft-card--blueprint">
              <div>
                <span style={{ fontFamily: 'var(--st-mono)', fontSize: 11.5, opacity: 0.9 }}>01 · INSTANT DOMAIN + TLS</span>
                <h3 className="zen-lp-studio__card-title" style={{ marginTop: 12 }}>
                  Claim a real .com without touching DNS
                </h3>
                <p className="zen-lp-studio__card-body">
                  Stripe settlement triggers registrar purchase, edge DNS records, and Let’s Encrypt TLS automatically.
                </p>
              </div>

              <div className="zen-lp-studio__mini-console">
                <form className="zen-lp-studio__domain-form" onSubmit={onCheckDomain}>
                  <label htmlFor="studio-domain-input" style={{ position: 'absolute', left: -9999 }}>
                    Domain name to check
                  </label>
                  <input
                    id="studio-domain-input"
                    className="zen-lp-studio__domain-input"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    placeholder="youridea.com"
                  />
                  <button type="submit" className="zen-lp-studio__pill zen-lp-studio__pill--black">
                    Check
                  </button>
                </form>
                <div className="zen-lp-studio__domain-result" role="status">
                  <span>{checkedDomain}</span>
                  <span style={{ color: '#0070f3', fontWeight: 600 }}>Available · $25 launch pack</span>
                </div>
              </div>
            </article>

            <article className="zen-lp-studio__soft-card">
              <div>
                <span className="zen-lp-studio__kicker">02 · ZEN ARTIFACT PREVIEW</span>
                <h3 className="zen-lp-studio__card-title" style={{ marginTop: 12 }}>
                  Chat-composed pages that deploy verbatim
                </h3>
                <p className="zen-lp-studio__card-body" style={{ color: 'var(--st-muted)', opacity: 1 }}>
                  Every preview composes typed Zen components with a real waitlist database before you pay a cent.
                </p>
              </div>

              <div className="zen-lp-studio__mini-console">
                <div className="zen-lp-studio__template-tabs" role="group" aria-label="Mockup template">
                  {TEMPLATES.map((tpl, idx) => (
                    <button
                      key={tpl.id}
                      type="button"
                      className="zen-lp-studio__template-tab"
                      aria-pressed={templateIndex === idx}
                      onClick={() => setTemplateIndex(idx)}
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontFamily: 'var(--st-mono)', fontSize: 11.5, color: 'var(--st-support)' }}>
                    https://{active.domain} · {active.badge}
                  </div>
                  <div style={{ marginTop: 6, fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em' }}>
                    {active.headline}
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        {/* Attio editorial serif quotation + architectural stat strip */}
        <section id="proof-line" className="zen-lp-studio__quote-band">
          <blockquote className="zen-lp-studio__serif-quote">
            “Idle websites cost nothing to park in object storage while background compute covers the machine rent—so $5 a month works at scale.”
          </blockquote>
          <p style={{ marginTop: 18, fontFamily: 'var(--st-mono)', fontSize: 12, color: 'var(--st-support)' }}>
            ARCHITECTURE NOTE · EDGE-1 INGRESS + OPAL-NODE QUIC WAKE
          </p>

          <div className="zen-lp-studio__stat-strip">
            <div className="zen-lp-studio__stat-cell">
              <div className="zen-lp-studio__stat-num">0 MB</div>
              <div className="zen-lp-studio__stat-label">Spot RAM consumed while idle</div>
            </div>
            <div className="zen-lp-studio__stat-cell">
              <div className="zen-lp-studio__stat-num">110 ms</div>
              <div className="zen-lp-studio__stat-label">Cold HTTP wake over QUIC</div>
            </div>
            <div className="zen-lp-studio__stat-cell">
              <div className="zen-lp-studio__stat-num">$5 / mo</div>
              <div className="zen-lp-studio__stat-label">Flat hosting with SQLite WAL</div>
            </div>
          </div>
        </section>
      </div>

      {/* Attio / Ghost dark closing theater */}
      <footer id="studio-launch" className="zen-lp-studio__closing">
        <div className="zen-lp-studio__closing-inner">
          <div>
            <span style={{ fontFamily: 'var(--st-mono)', fontSize: 11.5, color: '#52aeff', letterSpacing: '0.08em' }}>
              READY IN SIXTY SECONDS
            </span>
            <h2 className="zen-lp-studio__opening-title" style={{ marginTop: 12, color: '#ffffff', fontSize: 'clamp(32px, 3.2vw, 44px)' }}>
              One Stripe form from 2am idea to live website.
            </h2>
            <p className="zen-lp-studio__closing-sub">
              $25 launch pack includes your .com domain for one year, automatic HTTPS, and persistent SQLite waitlist storage—then $5/mo flat.
            </p>
            <div className="zen-lp-studio__actions">
              <a className="zen-lp-studio__pill zen-lp-studio__pill--lg" style={{ background: '#ffffff', color: '#111318' }} href="#machinery">
                Start building
              </a>
              <a className="zen-lp-studio__pill zen-lp-studio__pill--lg" style={{ background: '#1e222b', color: '#e2e8f0' }} href="#studio-top">
                Back to top
              </a>
            </div>
          </div>

          <div className="zen-lp-studio__closing-box">
            <div style={{ fontFamily: 'var(--st-mono)', fontSize: 11.5, color: '#94a3b8' }}>INCLUDED IN EVERY LAUNCH</div>
            <ul style={{ marginTop: 18, display: 'grid', gap: 13, fontSize: 14.5 }}>
              <li>✓ Custom .com domain + automatic TLS certificate</li>
              <li>✓ Sandboxed WASM/V8 runtime (zero host shell risk)</li>
              <li>✓ Continuous SQLite WAL snapshots to R2 storage</li>
              <li>✓ Chat link to edit copy or export leads anytime</li>
            </ul>
          </div>
        </div>

        <div className="zen-lp-studio__footer">
          <span>Shipyard · Powered by Zen &amp; Opal Fabric</span>
          <div style={{ display: 'flex', gap: 20 }}>
            <a href="#machinery">Architecture</a>
            <a href="#proof-line">Benchmarks</a>
            <a href="#studio-launch">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
