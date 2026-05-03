'use client';
import { useState } from 'react';
import Link from 'next/link';

const TABS = [
  {
    id: 'customers',
    icon: '🛒',
    label: 'For Customers',
    accent: '#6366f1',
    accentLight: '#ede9fe',
    cta: { label: 'Start Browsing →', href: '/products' },
    steps: [
      {
        num: 1,
        icon: '🔍',
        bg: 'linear-gradient(135deg,#6366f1,#818cf8)',
        title: 'Search Nearby',
        desc: 'Browse verified shops and service providers filtered by your city, category, or keyword.',
        tag: 'Free & instant',
      },
      {
        num: 2,
        icon: '🏪',
        bg: 'linear-gradient(135deg,#0ea5e9,#38bdf8)',
        title: 'Explore Shops',
        desc: 'Open any shop page — view products, photo gallery, ratings, and all social links.',
        tag: 'No account needed',
      },
      {
        num: 3,
        icon: '📞',
        bg: 'linear-gradient(135deg,#10b981,#34d399)',
        title: 'Connect Directly',
        desc: 'Get the vendor\'s WhatsApp or phone number instantly — zero commission, zero markup.',
        tag: 'Direct contact',
      },
    ],
  },
  {
    id: 'vendors',
    icon: '🏪',
    label: 'For Vendors',
    accent: '#16a34a',
    accentLight: '#dcfce7',
    cta: { label: 'Register Your Shop →', href: '/signup' },
    steps: [
      {
        num: 1,
        icon: '📝',
        bg: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
        title: 'Create Your Shop',
        desc: 'Register free in minutes. Add your shop name, logo, location, and product categories.',
        tag: '100% free',
      },
      {
        num: 2,
        icon: '📦',
        bg: 'linear-gradient(135deg,#ef4444,#f87171)',
        title: 'List Your Products',
        desc: 'Upload products with photos, prices, and tags. Appear in local customer searches automatically.',
        tag: 'Unlimited listings',
      },
      {
        num: 3,
        icon: '📋',
        bg: 'linear-gradient(135deg,#8b5cf6,#a78bfa)',
        title: 'Receive Leads',
        desc: 'Customers request your contact via your shop page. Close sales directly — no platform cut.',
        tag: 'Zero commission',
      },
    ],
  },
] as const;

export default function HowItWorks() {
  const [active, setActive] = useState<'customers' | 'vendors'>('customers');
  const tab = TABS.find(t => t.id === active)!;

  return (
    <section className="hiw2-section">

      {/* Background blobs */}
      <div className="hiw2-blob hiw2-blob-1" />
      <div className="hiw2-blob hiw2-blob-2" />

      <div className="container hiw2-inner">

        {/* Header */}
        <div className="hiw2-header reveal">
          <span className="hiw2-badge">⚡ Simple Process</span>
          <h2 className="hiw2-title">How ServeHub Works</h2>
          <p className="hiw2-sub">Two journeys. One platform. Everything local.</p>
        </div>

        {/* Toggle tabs */}
        <div className="hiw2-toggle reveal">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`hiw2-toggle-btn${active === t.id ? ' hiw2-toggle-active' : ''}`}
              style={active === t.id ? { background: t.accent, color: '#fff', borderColor: t.accent } : {}}
              onClick={() => setActive(t.id as 'customers' | 'vendors')}
            >
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Steps */}
        <div className="hiw2-steps" key={active}>
          {tab.steps.map((s, i) => (
            <div key={s.num} className="hiw2-step" style={{ animationDelay: `${i * 0.1}s` }}>

              {/* Connector line (not on last step) */}
              {i < tab.steps.length - 1 && (
                <div className="hiw2-connector">
                  <div className="hiw2-connector-line" style={{ background: `linear-gradient(180deg,${tab.accent}66,${tab.accent}11)` }} />
                  <div className="hiw2-connector-dot" style={{ background: tab.accent }} />
                </div>
              )}

              {/* Step card */}
              <div className="hiw2-card">

                {/* Number badge */}
                <div className="hiw2-num" style={{ background: tab.accentLight, color: tab.accent }}>
                  {String(s.num).padStart(2, '0')}
                </div>

                {/* Icon circle */}
                <div className="hiw2-icon-wrap" style={{ background: s.bg }}>
                  <span className="hiw2-icon">{s.icon}</span>
                </div>

                {/* Text */}
                <div className="hiw2-text">
                  <div className="hiw2-step-header">
                    <h3 className="hiw2-step-title">{s.title}</h3>
                    <span className="hiw2-step-tag" style={{ background: tab.accentLight, color: tab.accent }}>
                      {s.tag}
                    </span>
                  </div>
                  <p className="hiw2-step-desc">{s.desc}</p>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="hiw2-cta-wrap">
          <Link href={tab.cta.href}>
            <button className="hiw2-cta-btn" style={{ background: tab.accent }}>
              {tab.cta.label}
            </button>
          </Link>
          <p className="hiw2-cta-note">Free to use · No credit card required</p>
        </div>

      </div>
    </section>
  );
}
