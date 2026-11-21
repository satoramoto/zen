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
    badge: 'Stripe Checkout · 0ms wake',
  },
  {
    id: 'api',
    label: 'Landing + AI API',
    domain: 'clipnotes.dev',
    headline: 'Turn voice memos into structured release notes.',
    badge: 'WASM + GPU endpoint',
  },
] as const;

/** Expo-locked sculptural prism emitting localized blue and orange glow inside soft machinery. */
function RadiantPrism() {
  return (
    <svg viewBox="0 0 360 280" width="320" height="250" aria-hidden="true" style={{ position: 'relative', zIndex: 1 }}>
      <defs>
        <linearGradient id="st-plate-a" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e6f4fe" />
        </linearGradient>
        <linearGradient id="st-plate-b" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2788f3" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0d74ce" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="st-plate-c" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f76809" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#ffb224" stopOpacity="0.65" />
        </linearGradient>
      </defs>
      {/* Back layer */}
      <polygon points="180,34 294,96 180,158 66,96" fill="url(#st-plate-b)" stroke="#ffffff" strokeWidth="1.5" />
      {/* Middle layer */}
      <polygon points="180,76 294,138 180,200 66,138" fill="url(#st-plate-c)" stroke="#ffffff" strokeWidth="1.5" />
      {/* Front frosted cap */}
      <polygon points="180,118 294,180 180,242 66,180" fill="url(#st-plate-a)" stroke="#d9d9e0" strokeWidth="1.5" />
      <circle cx="180" cy="180" r="9" fill="#1c2024" />
      <circle cx="180" cy="180" r="4" fill="#ffffff" />
      <line x1="180" y1="34" x2="180" y2="171" stroke="#1c2024" strokeOpacity="0.2" strokeDasharray="3 3" />
    </svg>
  );
}

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
      <div className="zen-lp-studio__container">
        <nav className="zen-lp-studio__nav" aria-label="Primary">
          <a className="zen-lp-studio__brand" href="#studio-top">
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              <rect x="2" y="2" width="16" height="16" rx="5" fill="#1c2024" />
              <circle cx="10" cy="10" r="3.5" fill="#ffffff" />
            </svg>
            <span>Shipyard</span>
          </a>
          <ul className="zen-lp-studio__nav-links">
            <li><a href="#machinery">How it works</a></li>
            <li><a href="#proof-line">Reliability</a></li>
            <li><a href="#studio-launch">Pricing</a></li>
          </ul>
          <a className="zen-lp-studio__pill zen-lp-studio__pill--black" href="#studio-launch">Launch an idea</a>
        </nav>

        {/* Expo 3-part asymmetric opening */}
        <header id="studio-top" className="zen-lp-studio__hero">
          <div>
            <h1 className="zen-lp-studio__opening-title">
              Talk through an idea. Put it live in sixty seconds.
            </h1>
            <div className="zen-lp-studio__actions">
              <a className="zen-lp-studio__pill zen-lp-studio__pill--black" href="#machinery">Try domain check</a>
              <a className="zen-lp-studio__pill zen-lp-studio__pill--gray" href="#studio-launch">$5/mo flat</a>
            </div>
          </div>

          <div className="zen-lp-studio__hero-stage">
            <div className="zen-lp-studio__glow-pool">
              <RadiantPrism />
            </div>
          </div>

          <div className="zen-lp-studio__hero-right">
            <span className="zen-lp-studio__badge">WASM + SQLITE WAL</span>
            <p className="zen-lp-studio__support">
              Zero server config, zero WordPress plugins, zero surprise bandwidth bills. Your site wakes on request in 110ms and snapshots straight to object storage.
            </p>
            <a className="zen-lp-studio__text-link" href="#machinery">Inspect the sandbox architecture →</a>
          </div>
        </header>

        {/* Soft machinery 40px-radius cards */}
        <section id="machinery" className="zen-lp-studio__machinery">
          <h2 className="zen-lp-studio__section-lead">
            Soft machinery built for two-minute launches
          </h2>

          <div className="zen-lp-studio__machinery-grid">
            <article className="zen-lp-studio__soft-card">
              <div>
                <span className="zen-lp-studio__badge">01 · INSTANT DOMAIN + TLS</span>
                <h3 className="zen-lp-studio__card-title" style={{ marginTop: 14 }}>
                  Claim a real .com and ship without touching DNS
                </h3>
                <p className="zen-lp-studio__card-body">
                  One Stripe form registers the domain, configures edge DNS, and issues Let’s Encrypt HTTPS automatically.
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
                  <span style={{ color: '#0d74ce', fontWeight: 600 }}>Available · $25 launch pack</span>
                </div>
              </div>
            </article>

            <article className="zen-lp-studio__soft-card">
              <div>
                <span className="zen-lp-studio__badge">02 · ZEN ARTIFACT PREVIEW</span>
                <h3 className="zen-lp-studio__card-title" style={{ marginTop: 14 }}>
                  Chat-composed pages that deploy verbatim
                </h3>
                <p className="zen-lp-studio__card-body">
                  Preview a live landing page with working waitlist capture before paying a cent, then deploy that exact bundle.
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
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontFamily: 'var(--st-mono)', fontSize: 12, color: 'var(--st-muted)' }}>
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

        {/* Embedded statement proof */}
        <section id="proof-line" className="zen-lp-studio__statement-band">
          <p className="zen-lp-studio__statement">
            Idle sites cost <span className="zen-lp-studio__inline-chip">0 MB RAM</span> on spot hosts, wake in{' '}
            <span className="zen-lp-studio__inline-chip">110 ms</span> over QUIC, and cost{' '}
            <span className="zen-lp-studio__inline-chip">$5 / mo</span> flat.
          </p>
        </section>
      </div>

      {/* Inverted dark closing invitation */}
      <footer id="studio-launch" className="zen-lp-studio__closing">
        <div className="zen-lp-studio__container">
          <div className="zen-lp-studio__closing-inner">
            <div>
              <span style={{ fontFamily: 'var(--st-mono)', fontSize: 12, color: '#2788f3', letterSpacing: '0.08em' }}>
                READY IN SIXTY SECONDS
              </span>
              <h2 className="zen-lp-studio__opening-title" style={{ marginTop: 12, color: '#ffffff' }}>
                One Stripe form from 2am idea to live website.
              </h2>
              <p className="zen-lp-studio__closing-sub">
                $25 launch pack includes your `.com` domain for a year, automatic HTTPS, and persistent SQLite waitlist storage—then $5/mo flat.
              </p>
              <div className="zen-lp-studio__actions">
                <a className="zen-lp-studio__pill zen-lp-studio__pill--lg" style={{ background: '#ffffff', color: '#000000' }} href="#machinery">
                  Start building
                </a>
                <a className="zen-lp-studio__pill zen-lp-studio__pill--lg" style={{ background: '#212225', color: '#edeef0' }} href="#studio-top">
                  Back to top
                </a>
              </div>
            </div>

            <div className="zen-lp-studio__closing-box">
              <div style={{ fontFamily: 'var(--st-mono)', fontSize: 12, color: '#b0b4ba' }}>INCLUDED IN EVERY LAUNCH</div>
              <ul style={{ marginTop: 20, display: 'grid', gap: 14, fontSize: 15 }}>
                <li>✓ Custom `.com` domain + automatic TLS certificate</li>
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
        </div>
      </footer>
    </div>
  );
}
