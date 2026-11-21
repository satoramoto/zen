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

/** Thick-outlined Gumroad-style physical badge tokens floating around the paper opening. */
function FloatingCoin({ label, sub, fill, size = 104 }: { label: string; sub?: string; fill: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 114 114" aria-hidden="true">
      <ellipse cx="60" cy="60" rx="48" ry="48" fill="#000000" />
      <circle cx="54" cy="54" r="48" fill={fill} stroke="#000000" strokeWidth="3" />
      <circle cx="54" cy="54" r="41" fill="none" stroke="#000000" strokeWidth="1.5" strokeDasharray="4 4" />
      <text
        x="54"
        y={sub ? '51' : '61'}
        textAnchor="middle"
        fontFamily="DM Sans, Inter, sans-serif"
        fontWeight="800"
        fontSize="23"
        fill="#000000"
      >
        {label}
      </text>
      {sub && (
        <text
          x="54"
          y="70"
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontWeight="700"
          fontSize="9.5"
          fill="#000000"
        >
          {sub}
        </text>
      )}
    </svg>
  );
}

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
      {/* Gumroad edge-divided white navbar */}
      <nav className="zen-lp-impulse__nav" aria-label="Primary">
        <div className="zen-lp-impulse__nav-left">
          <a className="zen-lp-impulse__brand" href="#impulse-top">nightshift</a>
          <span className="zen-lp-impulse__count-pill">★ 1,420 live sites</span>
        </div>

        <ul className="zen-lp-impulse__nav-links">
          <li><a href="#how-it-works">How it works</a></li>
          <li><a href="#examples">Examples</a></li>
          <li><a href="#faq">FAQ</a></li>
        </ul>

        <div className="zen-lp-impulse__nav-right">
          <a className="zen-lp-impulse__nav-cell" href="#faq">Pricing</a>
          <a className="zen-lp-impulse__nav-cell zen-lp-impulse__nav-cell--black" href="#impulse-close">
            Claim yours
          </a>
        </div>
      </nav>

      {/* Gumroad warm paper centered hero with floating tokens + peeking live preview */}
      <header id="impulse-top" className="zen-lp-impulse__hero">
        <div className="zen-lp-impulse__coin zen-lp-impulse__coin--tl">
          <FloatingCoin label="$5" sub="/ MONTH" fill="#ff90e8" size={112} />
        </div>
        <div className="zen-lp-impulse__coin zen-lp-impulse__coin--bl">
          <FloatingCoin label=".COM" sub="INCLUDED" fill="#ffc900" size={96} />
        </div>
        <div className="zen-lp-impulse__coin zen-lp-impulse__coin--tr">
          <FloatingCoin label="TLS" sub="AUTO HTTPS" fill="#d2e823" size={104} />
        </div>
        <div className="zen-lp-impulse__coin zen-lp-impulse__coin--br">
          <FloatingCoin label="60s" sub="SHIP TIME" fill="#ff90e8" size={100} />
        </div>

        <div className="zen-lp-impulse__hero-center">
          <h1 className="zen-lp-impulse__display">
            Go from 2am idea to live .com
          </h1>
          <p className="zen-lp-impulse__hero-sub">
            Riff with an AI co-founder, watch it sketch a real Zen landing page right beside the chat, and put it online with one Stripe form.
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
            <button type="submit" className="zen-lp-impulse__gum-btn">
              Preview my site
            </button>
          </form>
          <p className="zen-lp-impulse__claim-status" role="status">
            Live preview ready for {claimed}
          </p>
        </div>

        {/* Peeking browser mockup */}
        <div className="zen-lp-impulse__peek-wrap" aria-label="Generated site preview stack">
          <div className="zen-lp-impulse__site-frame">
            <div className="zen-lp-impulse__site-chrome">
              <span style={{ fontWeight: 700 }}>https://{claimed}</span>
              <span style={{ background: '#d2e823', padding: '2px 10px', borderRadius: 999, border: '1.5px solid #000', fontSize: 10.5, fontWeight: 700 }}>
                TLS LIVE · EDGE-1
              </span>
            </div>
            <div className="zen-lp-impulse__site-body">
              <div>
                <div style={{ fontFamily: 'var(--imp-display)', fontSize: 28, fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.025em' }}>
                  Fresh sourdough kits, dropped every Sunday at 8am.
                </div>
                <p style={{ marginTop: 8, fontSize: 14, color: 'var(--imp-muted)' }}>
                  Built in Zen from a 90-second chat. Connected to a real SQLite waitlist.
                </p>
                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, height: 40, borderRadius: 6, border: '2px solid #000', background: '#f4f4f0', display: 'flex', alignItems: 'center', paddingInline: 12, fontSize: 13, color: '#585b54' }}>
                    founder@earlybird.co
                  </div>
                  <div style={{ height: 40, paddingInline: 16, borderRadius: 6, border: '2px solid #000', background: '#d2e823', color: '#000', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700 }}>
                    Join waitlist
                  </div>
                </div>
              </div>

              <div className="zen-lp-impulse__receipt-sticker">
                <div style={{ fontFamily: 'var(--imp-mono)', fontSize: 10.5, fontWeight: 700 }}>STRIPE LAUNCH PACK</div>
                <div style={{ marginTop: 4, fontSize: 19, fontWeight: 700 }}>
                  $25 today · $5/mo
                </div>
                <div style={{ fontSize: 12.5, marginTop: 2 }}>Includes 1-yr .com + edge HTTPS</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Blue capability chapter */}
      <section id="how-it-works" className="zen-lp-impulse__chapter zen-lp-impulse__chapter--blue">
        <div className="zen-lp-impulse__container">
          <div className="zen-lp-impulse__split">
            <div className="zen-lp-impulse__bento-tile" style={{ background: '#061492', color: '#ffffff' }}>
              <span style={{ fontFamily: 'var(--imp-mono)', fontSize: 12, color: '#d2e823', fontWeight: 700 }}>
                STEP 1 → STEP 3
              </span>
              <ol style={{ display: 'grid', gap: 16, fontSize: 18, fontWeight: 600 }}>
                <li>1. Pitch your dumb or brilliant idea to the bot</li>
                <li>2. Watch a real Zen site update beside the chat</li>
                <li>3. Clear one Stripe form — domain + TLS go live</li>
              </ol>
            </div>
            <div>
              <h2 className="zen-lp-impulse__h2">
                Create and launch your corner of the internet in minutes
              </h2>
              <p className="zen-lp-impulse__hero-sub" style={{ marginInline: 0 }}>
                No DNS records to decipher, no AWS consoles, and no bloated WordPress plugins to patch. Your site sleeps for pennies until someone visits.
              </p>
              <div style={{ marginTop: 28 }}>
                <a className="zen-lp-impulse__btn zen-lp-impulse__btn--lime" href="#impulse-close">Start chatting free</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Paper proof rail + Gumroad-bordered Bento */}
      <section id="examples" className="zen-lp-impulse__chapter zen-lp-impulse__chapter--paper">
        <div className="zen-lp-impulse__container">
          <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
            <h2 className="zen-lp-impulse__h2">
              Made at midnight for
              <span className="zen-lp-impulse__category">side projects &amp; test balloons</span>
            </h2>
          </div>

          <div className="zen-lp-impulse__proof-rail">
            <div className="zen-lp-impulse__proof-tile" style={{ borderRadius: 16, background: '#254f1a', color: '#d2e823' }}>
              <span>WAITLISTS</span>
              <span style={{ fontSize: 20 }}>dogwalker.club</span>
            </div>
            <div className="zen-lp-impulse__proof-tile" style={{ borderRadius: 48, background: '#ff90e8', color: '#000' }}>
              <span>LOCAL SHOPS</span>
              <span style={{ fontSize: 20 }}>oakstreetbake.com</span>
            </div>
            <div className="zen-lp-impulse__proof-tile" style={{ borderRadius: 9999, background: '#ffc900', color: '#000', textAlign: 'center', alignItems: 'center' }}>
              <span>AI TOOLS</span>
              <span style={{ fontSize: 20 }}>briefme.app</span>
            </div>
            <div className="zen-lp-impulse__proof-tile" style={{ borderRadius: 28, background: '#780016', color: '#ffffff' }}>
              <span>EVENTS</span>
              <span style={{ fontSize: 20 }}>roofcinema.co</span>
            </div>
          </div>

          <div className="zen-lp-impulse__bento">
            <div className="zen-lp-impulse__bento-left">
              <div className="zen-lp-impulse__bento-tile" style={{ background: '#e9c0e9', color: '#000' }}>
                <span style={{ fontFamily: 'var(--imp-mono)', fontSize: 12, fontWeight: 700 }}>ZEN DESIGN SYSTEM</span>
                <h3>Clean layouts from day one—no uncanny AI gradients</h3>
              </div>
              <div className="zen-lp-impulse__bento-tile" style={{ background: '#d2e823', color: '#000' }}>
                <span style={{ fontFamily: 'var(--imp-mono)', fontSize: 12, fontWeight: 700 }}>FLAT BILLING</span>
                <h3>$5/mo flat so a viral post never sends a shock bill</h3>
              </div>
            </div>
            <div className="zen-lp-impulse__bento-tile" style={{ background: '#061492', color: '#ffffff' }}>
              <span style={{ fontFamily: 'var(--imp-mono)', fontSize: 12, fontWeight: 700, color: '#d2e823' }}>BUILT-IN PERSISTENCE</span>
              <h3>Real email &amp; waitlist collection backed by replicated SQLite</h3>
              <p style={{ fontSize: 16, opacity: 0.9 }}>
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

      {/* Purple Closing Invitation */}
      <section id="impulse-close" className="zen-lp-impulse__closing">
        <div className="zen-lp-impulse__container">
          <div className="zen-lp-impulse__closing-head">
            <h2 className="zen-lp-impulse__h2">
              Jumpstart your 2am corner of the internet today
            </h2>
            <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
              <a className="zen-lp-impulse__btn zen-lp-impulse__btn--lime" href="#impulse-top">
                Claim {claimed}
              </a>
              <a className="zen-lp-impulse__btn zen-lp-impulse__btn--lilac" href="#examples">
                See examples
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Black Gumroad Footer */}
      <footer className="zen-lp-impulse__footer">
        <div className="zen-lp-impulse__container">
          <div className="zen-lp-impulse__footer-grid">
            <div>
              <div style={{ fontFamily: 'var(--imp-display)', fontSize: 28, fontWeight: 700 }}>nightshift</div>
              <p style={{ marginTop: 10, fontSize: 14, color: 'rgba(255,255,255,0.7)', maxWidth: 280 }}>
                From random midnight thought to a live .com in one Stripe checkout.
              </p>
            </div>
            <div>
              <h3>Product</h3>
              <ul>
                <li><a href="#impulse-top">Idea chat</a></li>
                <li><a href="#how-it-works">Domain setup</a></li>
                <li><a href="#examples">Zen templates</a></li>
              </ul>
            </div>
            <div>
              <h3>Engine</h3>
              <ul>
                <li><a href="#how-it-works">Opal Fabric</a></li>
                <li><a href="#how-it-works">WASM sandbox</a></li>
                <li><a href="#how-it-works">SQLite WAL</a></li>
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
