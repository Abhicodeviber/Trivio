const steps = [
  { num: '01', icon: '🔍', title: 'Search & Discover', desc: 'Browse thousands of verified service providers filtered by location, category, and rating.' },
  { num: '02', icon: '👤', title: 'View Profiles', desc: 'Check provider portfolios, read reviews, and compare pricing to find the perfect match.' },
  { num: '03', icon: '✅', title: 'Connect & Done', desc: 'Contact directly, book the service, and get the job done with confidence.' },
];

export default function HowItWorks() {
  return (
    <section className="section section-alt">
      <div className="container">
        <div className="section-header reveal">
          <h2>How It Works</h2>
          <p>Get started in three simple steps</p>
        </div>
        <div className="steps-grid">
          {steps.map((s, i) => (
            <>
              <div key={s.num} className={`step-card ${i === 0 ? 'reveal-left' : i === 2 ? 'reveal-right' : 'reveal'}`} style={i === 1 ? { transitionDelay: '.15s' } : {}}>
                <div className="step-number">{s.num}</div>
                <div className="step-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
              {i < steps.length - 1 && <div key={`arrow-${i}`} className="step-arrow reveal">→</div>}
            </>
          ))}
        </div>
      </div>
    </section>
  );
}
