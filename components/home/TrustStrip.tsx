const items = [
  '🏪 2,400+ Verified Shops',
  '⭐ 4.9 Average Rating',
  '📦 Free Product Listings',
  '📋 Direct Customer Leads',
  '🎯 Homepage Promotions',
  '✅ Verified Vendor Badge',
  '⚡ Go Live in 3 Minutes',
  '💰 Zero Commission',
  '🛡️ Secure Platform',
  '🏆 Top Rated Vendors',
];

export default function TrustStrip() {
  const all = [...items, ...items];
  return (
    <div className="trust-strip">
      <div className="trust-track">
        {all.map((item, i) => (
          <div key={i} className="trust-item">
            <span>{item.split(' ')[0]}</span>
            {item.split(' ').slice(1).join(' ')}
          </div>
        ))}
      </div>
    </div>
  );
}
