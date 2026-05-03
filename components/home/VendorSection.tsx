import Link from 'next/link';

const FEATURES = [
  { icon: '🏪', title: 'Your Own Storefront',   desc: 'Get a dedicated shop page that feels like your own website — logo, products, ratings and all.' },
  { icon: '📦', title: 'Product Listings',       desc: 'Upload unlimited products with images, pricing and categories. Customers can find you by search.' },
  { icon: '📋', title: 'Customer Leads',         desc: 'When a customer taps "Contact", you get their details directly — no middleman, no commission.' },
  { icon: '🎯', title: 'Homepage Promotions',    desc: 'Run banner ads on the homepage slider. Choose a plan, upload creative, go live in minutes.' },
  { icon: '📊', title: 'Sales Dashboard',        desc: 'Track total products, in-stock count, lead volume and promotion performance in one place.' },
  { icon: '✅', title: 'Verified Badge',         desc: 'Approved vendors get a verification badge that builds customer trust and boosts conversions.' },
];

const STATS = [
  { value: '2,400+', label: 'Active Shops' },
  { value: '50K+',   label: 'Monthly Visitors' },
  { value: '₹0',     label: 'Setup Cost' },
  { value: '3 min',  label: 'To Go Live' },
];

export default function VendorSection() {
  return (
    <section className="vendor-section">
      {/* Top label */}
      <div className="container">
        <div className="vs-label reveal">For Shop Owners &amp; Vendors</div>
        <div className="vs-header reveal">
          <h2 className="vs-title">
            Grow Your Business<br />
            <span className="vs-title-accent">with ServeHub</span>
          </h2>
          <p className="vs-sub">
            We built ServeHub for local vendors. List your shop, reach customers searching nearby, and run promotions — all in one platform, completely free to start.
          </p>
        </div>

        {/* Stats row */}
        <div className="vs-stats reveal">
          {STATS.map(s => (
            <div key={s.label} className="vs-stat">
              <div className="vs-stat-val">{s.value}</div>
              <div className="vs-stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Features grid */}
        <div className="vs-grid">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="vs-card reveal" style={{ transitionDelay: `${i * 0.06}s` }}>
              <div className="vs-card-icon">{f.icon}</div>
              <div>
                <h3 className="vs-card-title">{f.title}</h3>
                <p className="vs-card-desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="vs-cta reveal">
          <div className="vs-cta-left">
            <h3>Ready to list your shop?</h3>
            <p>Join thousands of vendors already growing on ServeHub. Free forever for basic listings.</p>
          </div>
          <div className="vs-cta-actions">
            <Link href="/signup">
              <button className="vs-btn-primary">Register Your Shop →</button>
            </Link>
            <Link href="/products">
              <button className="vs-btn-ghost">Browse Shops</button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
