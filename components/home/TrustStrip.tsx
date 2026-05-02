const items = ['🔒 Verified Providers','⭐ 4.9 Average Rating','⚡ Fast Response','🛡️ Insured & Licensed','💬 24/7 Support','✅ Background Checked','🏆 Top Rated Pros','💰 Best Price Guarantee'];

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
