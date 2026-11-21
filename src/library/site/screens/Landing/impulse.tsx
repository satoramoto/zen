import { useState, type FormEvent } from 'react';

const FAQS = [
  {
    q: 'What happens if I only get 12 visitors all month?',
    a: 'Your site sleeps in object storage and wakes in under 150ms when someone visits. That is why we can keep hosting at $5/mo flat without charging surprise server fees.',
  },
  {
    q: 'Can the chatbot actually buy my domain and set up HTTPS?',
    a: 'Yes. Once your card clears Stripe Checkout, we register the domain through our registrar API, wire DNS straight to our edge proxy, and provision Let’s Encrypt TLS automatically.',
  },
  {
    q: 'Am I stuck if I want to change the copy at 3am?',
    a: 'Never. Open your magic chat link anytime, tell the bot what to change, preview it live, and republish in one click.',
  },
];

export function ImpulseLaunch() {
  const [handle, setHandle] = useState('toastclub');
  const [claimed, setClaimed] = useState('toastclub.com');

  const onClaim = (e: FormEvent) => {
    e.preventDefault();
    const clean = handle.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || 'toastclub';
    setClaimed(`${clean}.com`);
  };

  return (
    <div className="zen-lp zen-lp-impulse">
      <div className="zen-lp-impulse__promo">
        Launch pack: custom .com + live site + waitlist form in 60 seconds — $25 today, then $5/mo.
      </div>

      <div className="zen-lp-impulse__nav-sticky">
        <nav className="zen-lp-impulse__nav" aria-label="Primary">
          <a className="zen-lp-impulse__brand" href="#impulse-top">nightshift</a>
          <ul className="zen-lp-impulse__nav-links">
            <li><a href="#how-it-works">How it works</a></li>
            <li><a href="#examples">Examples</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
          <div className="zen-lp-impulse__nav-cta">
            <a className="zen-lp-impulse__btn zen-lp-impulse__btn--nav" href="#impulse-close">Claim yours</a>
          </div>
        </nav>
      </div>

      {/* Lime opening split */}
      <header id="impulse-top" className="zen-lp-impulse__hero">
        <div className="zen-lp-impulse__container">
          <div className="zen-lp-impulse__split">
            <div>
              <h1 className="zen-lp-impulse__display">
                Every 2am idea deserves a real website before morning.
              </h1>
              <p className="zen-lp-impulse__hero-sub">
                Riff with an AI co-founder, watch it sketch a real Zen landing page next to the chat, and put it live on your own .com with one Stripe form.
              </p>

              <form className="zen-lp-impulse__claim-row" onSubmit={onClaim}>
                <label className="zen-lp-impulse__claim-box">
                  <span className="zen-lp-impulse__claim-prefix">https://</span>
                  <input
                    aria-label="Choose your site name"
                    className="zen-lp-impulse__claim-input"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="youridea"
                  />
                  <span className="zen-lp-impulse__claim-prefix">.com</span>
                </label>
                <button type="submit" className="zen-lp-impulse__btn zen-lp-impulse__btn--forest">
                  Preview my site
                </button>
              </form>
              <p className="zen-lp-impulse__claim-status" role="status">
                Live preview ready for {claimed}
              </p>
            </div>

            {/* Living output tower (floating cards directly on lime, no browser chrome) */}
            <div className="zen-lp-impulse__tower" aria-label="Generated site preview stack">
              <div className="zen-lp-impulse__output-card zen-lp-impulse__output-card--tilted">
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  CHAT MOCKUP · LIVE DRAFT
                </div>
                <div style={{ marginTop: 10, fontSize: 24, fontWeight: 700, lineHeight: 1.15 }}>
                  {claimed}
                </div>
                <p style={{ marginTop: 8, fontSize: 14, opacity: 0.9 }}>
                  “We ship artisanal sourdough toast kits every Sunday morning.”
                </p>
              </div>

              <div className="zen-lp-impulse__output-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>Waitlist open</span>
                  <span style={{ fontSize: 13, color: 'var(--imp-muted)' }}>SQLite · instant</span>
                </div>
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, height: 40, borderRadius: 8, background: '#f3f3f1', display: 'flex', alignItems: 'center', paddingInline: 12, fontSize: 13, color: '#676b5f' }}>
                    founder@earlybird.co
                  </div>
                  <div style={{ height: 40, paddingInline: 18, borderRadius: 9999, background: '#254f1a', color: '#d2e823', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700 }}>
                    Join
                  </div>
                </div>
              </div>

              <div className="zen-lp-impulse__output-card zen-lp-impulse__output-card--accent">
                <div style={{ fontSize: 13, opacity: 0.85 }}>DNS · HTTPS · EDGE WAKE</div>
                <div style={{ marginTop: 6, fontSize: 22, fontWeight: 700 }}>
                  $25 today · $5/mo after
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Blue capability chapter */}
      <section id="how-it-works" className="zen-lp-impulse__chapter zen-lp-impulse__chapter--blue">
        <div className="zen-lp-impulse__container">
          <div className="zen-lp-impulse__split">
            <div className="zen-lp-impulse__output-card" style={{ background: '#061492', color: '#ffffff', padding: 36 }}>
              <div style={{ fontSize: 13, color: '#d2e823', fontWeight: 700 }}>STEP 1 → STEP 3</div>
              <ol style={{ marginTop: 20, display: 'grid', gap: 18, fontSize: 18, fontWeight: 500 }}>
                <li>1. Pitch your dumb or brilliant idea to the bot</li>
                <li>2. Watch a real landing page update beside the chat</li>
                <li>3. Clear one Stripe form — domain + TLS go live</li>
              </ol>
            </div>
            <div>
              <h2 className="zen-lp-impulse__h2">
                Create and launch your corner of the internet in minutes
              </h2>
              <p className="zen-lp-impulse__hero-sub">
                No DNS records to decipher, no AWS consoles, and no bloated WordPress themes to patch. You get a crisp site with a working signup form that sleeps for pennies until someone visits.
              </p>
              <div style={{ marginTop: 28 }}>
                <a className="zen-lp-impulse__btn zen-lp-impulse__btn--lime" href="#impulse-close">Start chatting free</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Marble proof rail + Asymmetrical Bento */}
      <section id="examples" className="zen-lp-impulse__chapter zen-lp-impulse__chapter--marble">
        <div className="zen-lp-impulse__container">
          <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
            <h2 className="zen-lp-impulse__h2">
              Made at midnight for
              <span className="zen-lp-impulse__category">side projects &amp; test balloons</span>
            </h2>
          </div>

          <div className="zen-lp-impulse__proof-rail">
            <div className="zen-lp-impulse__proof-tile zen-lp-impulse__proof-tile--r16">
              <span>WAITLISTS</span>
              <span style={{ fontSize: 22 }}>dogwalker.club</span>
            </div>
            <div className="zen-lp-impulse__proof-tile zen-lp-impulse__proof-tile--r64">
              <span>LOCAL SHOPS</span>
              <span style={{ fontSize: 22 }}>oakstreetbake.com</span>
            </div>
            <div className="zen-lp-impulse__proof-tile zen-lp-impulse__proof-tile--pill">
              <span>AI TOOLS</span>
              <span style={{ fontSize: 22 }}>briefme.app</span>
            </div>
            <div className="zen-lp-impulse__proof-tile zen-lp-impulse__proof-tile--r32">
              <span>EVENTS</span>
              <span style={{ fontSize: 22 }}>roofcinema.co</span>
            </div>
          </div>

          <div className="zen-lp-impulse__bento">
            <div className="zen-lp-impulse__bento-left">
              <div className="zen-lp-impulse__bento-tile" style={{ background: '#e9c0e9', color: '#1e2330' }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>ZEN DESIGN SYSTEM</span>
                <h3>Clean layouts from day one—no uncanny AI gradients</h3>
              </div>
              <div className="zen-lp-impulse__bento-tile" style={{ background: '#d2e823', color: '#254f1a' }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>FLAT BILLING</span>
                <h3>$5/mo flat so a viral post never sends a shock bill</h3>
              </div>
            </div>
            <div className="zen-lp-impulse__bento-tile" style={{ background: '#061492', color: '#ffffff' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#d2e823' }}>BUILT-IN PERSISTENCE</span>
              <h3>Real email &amp; waitlist collection backed by replicated SQLite</h3>
              <p style={{ fontSize: 16, opacity: 0.88 }}>
                Every launched site includes an authenticated chat view to export leads, swap headlines, or add sections whenever inspiration strikes again.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Burgundy FAQ */}
      <section id="faq" className="zen-lp-impulse__chapter zen-lp-impulse__chapter--burgundy">
        <div className="zen-lp-impulse__container">
          <h2 className="zen-lp-impulse__h2" style={{ textAlign: 'center' }}>
            Questions? Answered
          </h2>
          <div className="zen-lp-impulse__faq-stack">
            {FAQS.map((item) => (
              <details key={item.q} className="zen-lp-impulse__faq-row">
                <summary>
                  <span>{item.q}</span>
                  <span aria-hidden="true">+</span>
                </summary>
                <div className="zen-lp-impulse__faq-answer">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Purple Finale with edge silhouettes + White 4-column footer panel */}
      <footer id="impulse-close" className="zen-lp-impulse__closing">
        <svg className="zen-lp-impulse__silhouette zen-lp-impulse__silhouette--left" viewBox="0 0 300 400" aria-hidden="true">
          <path d="M-20,40 C120,20 220,120 190,230 C165,320 60,350 -20,390 Z" fill="#e9c0e9" />
        </svg>
        <svg className="zen-lp-impulse__silhouette zen-lp-impulse__silhouette--right" viewBox="0 0 300 400" aria-hidden="true">
          <path d="M320,30 C180,50 110,160 150,270 C185,365 260,375 320,395 Z" fill="#d2e823" />
        </svg>

        <div className="zen-lp-impulse__container">
          <div className="zen-lp-impulse__closing-head">
            <h2 className="zen-lp-impulse__h2">
              Jumpstart your 2am corner of the internet today
            </h2>
            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <a className="zen-lp-impulse__btn zen-lp-impulse__btn--lime" href="#impulse-top">
                Claim {claimed}
              </a>
              <a className="zen-lp-impulse__btn zen-lp-impulse__btn--lilac" href="#examples">
                See examples
              </a>
            </div>
          </div>

          <div className="zen-lp-impulse__footer-panel">
            <div>
              <h3>Product</h3>
              <ul>
                <li><a href="#impulse-top">Idea chat</a></li>
                <li><a href="#how-it-works">Domain setup</a></li>
                <li><a href="#examples">Zen templates</a></li>
              </ul>
            </div>
            <div>
              <h3>Hosting</h3>
              <ul>
                <li><a href="#examples">Edge TLS</a></li>
                <li><a href="#examples">SQLite waitlists</a></li>
                <li><a href="#faq">Flat pricing</a></li>
              </ul>
            </div>
            <div>
              <h3>Engine</h3>
              <ul>
                <li><a href="#how-it-works">Opal Fabric</a></li>
                <li><a href="#how-it-works">WASM sandbox</a></li>
                <li><a href="#how-it-works">R2 snapshots</a></li>
              </ul>
            </div>
            <div>
              <h3>Company</h3>
              <ul>
                <li><a href="#impulse-top">Satoramoto</a></li>
                <li><a href="#faq">Support</a></li>
                <li><a href="#impulse-close">Terms</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
