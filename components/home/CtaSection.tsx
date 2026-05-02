import Link from 'next/link';

export default function CtaSection() {
  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-box reveal">
          <div className="cta-left">
            <h2>Ready to Offer Your Services?</h2>
            <p>Join 50,000+ providers and grow your business today.</p>
            <div className="cta-perks">
              <span>✓ Free to join</span>
              <span>✓ Set your own rates</span>
              <span>✓ Get verified</span>
            </div>
            <Link href="/signup"><button className="btn btn-white btn-lg">Become a Provider →</button></Link>
          </div>
          <div className="cta-right">
            <div className="cta-visual">
              <div className="cta-stat"><span>💰</span><div><strong>$2,400</strong><small>avg. monthly earnings</small></div></div>
              <div className="cta-stat"><span>⚡</span><div><strong>48hrs</strong><small>avg. first booking</small></div></div>
              <div className="cta-stat"><span>🏆</span><div><strong>4.8★</strong><small>provider satisfaction</small></div></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
