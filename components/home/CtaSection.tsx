import Link from 'next/link';

export default function CtaSection() {
  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-dual reveal">

          {/* Customer CTA */}
          <div className="cta-card cta-card-customer">
            <div className="cta-card-icon">🔍</div>
            <h3>Looking for a Service?</h3>
            <p>Browse thousands of verified providers and local shops. Find exactly what you need in seconds.</p>
            <ul className="cta-perks-list">
              <li>✓ Verified &amp; reviewed providers</li>
              <li>✓ Direct contact — no fees</li>
              <li>✓ Local shops near you</li>
            </ul>
            <Link href="/browse">
              <button className="cta-card-btn">Browse Services →</button>
            </Link>
          </div>

          {/* Vendor CTA */}
          <div className="cta-card cta-card-vendor">
            <div className="cta-card-badge">Free to Join</div>
            <div className="cta-card-icon">🏪</div>
            <h3>Own a Shop or Business?</h3>
            <p>List your shop, upload products, and start getting customer leads — all for free. Promote on the homepage to grow faster.</p>
            <ul className="cta-perks-list">
              <li>✓ Free shop page &amp; product listings</li>
              <li>✓ Direct customer leads</li>
              <li>✓ Homepage promotion plans</li>
            </ul>
            <div className="cta-card-stats">
              <div><strong>₹0</strong><span>to start</span></div>
              <div><strong>3 min</strong><span>setup time</span></div>
              <div><strong>50K+</strong><span>monthly reach</span></div>
            </div>
            <Link href="/signup">
              <button className="cta-card-btn cta-card-btn-vendor">Register Your Shop →</button>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
