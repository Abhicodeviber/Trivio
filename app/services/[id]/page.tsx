'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import VideoEmbed from '@/components/ui/VideoEmbed';

interface FieldDef {
  name: string;
  label: string;
  type: string;
  options?: string[];
  unit?: string;
}

interface Service {
  _id: string;
  title: string;
  description: string;
  price: number;
  priceType: 'hourly' | 'fixed' | 'negotiable';
  deliveryTime?: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  images: string[];
  isActive: boolean;
  mobile: string;
  whatsapp: string;
  videoUrl?: string;
  customFields: Record<string, unknown>;
  createdAt: string;
  category: {
    _id: string;
    name: string;
    slug: string;
    icon: string;
    description?: string;
    fields: FieldDef[];
  };
  provider: {
    _id: string;
    name: string;
    location?: string;
    bio?: string;
    skills: string[];
    rating: number;
    reviewCount: number;
  };
}

const COVER_GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
];

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: '#f59e0b', fontSize: 15 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i}>{i < Math.round(rating) ? '★' : '☆'}</span>
      ))}
    </span>
  );
}

function CustomFieldValue({ field, value }: { field: FieldDef; value: unknown }) {
  if (value === undefined || value === null || value === '') return null;
  let display: string;
  if (field.type === 'checkbox') display = value ? '✓ Yes' : '✗ No';
  else if (Array.isArray(value)) display = value.join(', ');
  else display = String(value) + (field.unit ? ` ${field.unit}` : '');

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-light)', fontSize: 14 }}>{field.label}</span>
      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--dark)' }}>{display}</span>
    </div>
  );
}

/* ── Reveal Number Button ── */
function RevealNumberBtn({
  serviceId,
  contactType,
  icon,
  label,
  actionLabel,
  color,
  bg,
  border,
  href,
}: {
  serviceId: string;
  contactType: 'mobile' | 'whatsapp';
  icon: string;
  label: string;
  actionLabel: string;
  color: string;
  bg: string;
  border: string;
  href: (number: string) => string;
}) {
  const [state, setState]   = useState<'hidden' | 'loading' | 'revealed'>('hidden');
  const [number, setNumber] = useState('');

  const reveal = useCallback(async () => {
    if (state !== 'hidden') return;
    setState('loading');
    try {
      const visitorId = localStorage.getItem('vh_visitor') ?? (() => {
        const id = Math.random().toString(36).slice(2);
        localStorage.setItem('vh_visitor', id);
        return id;
      })();

      const res  = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, contactType, visitorId }),
      });
      const data = await res.json();
      if (res.ok && data.number) {
        setNumber(data.number);
        setState('revealed');
      } else {
        setState('hidden');
      }
    } catch {
      setState('hidden');
    }
  }, [serviceId, contactType, state]);

  if (state === 'hidden') {
    return (
      <button
        onClick={reveal}
        className="btn btn-full"
        style={{ background: bg, border: `1.5px solid ${border}`, color, fontWeight: 700, fontSize: 14, justifyContent: 'center', gap: 8 }}
      >
        {icon} {label}
      </button>
    );
  }

  if (state === 'loading') {
    return (
      <button disabled className="btn btn-full" style={{ background: bg, border: `1.5px solid ${border}`, color, opacity: 0.7, justifyContent: 'center' }}>
        {icon} Revealing…
      </button>
    );
  }

  // revealed
  return (
    <a href={href(number)} target={contactType === 'whatsapp' ? '_blank' : undefined} rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          background: bg, border: `2px solid ${border}`, borderRadius: 8,
          padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          animation: 'fadeInUp 0.25s ease',
        }}
      >
        <span style={{ color, fontWeight: 700, fontSize: 15 }}>{icon} {number}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color, background: `${border}55`, padding: '3px 10px', borderRadius: 20 }}>{actionLabel} →</span>
      </div>
    </a>
  );
}

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [service, setService]     = useState<Service | null>(null);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'video' | 'provider'>('overview');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/services/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setNotFound(true);
        else setService(data.service);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const coverGrad = COVER_GRADIENTS[parseInt(id?.slice(-1) ?? '0', 16) % COVER_GRADIENTS.length];
  const providerInitials = service?.provider?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? 'PR';

  if (loading) return (
    <>
      <Navbar />
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⏳</div>
          <p style={{ color: 'var(--text-light)' }}>Loading service details...</p>
        </div>
      </div>
      <Footer />
    </>
  );

  if (notFound || !service) return (
    <>
      <Navbar />
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
          <h2 style={{ marginBottom: 8 }}>Service not found</h2>
          <p style={{ color: 'var(--text-light)', marginBottom: 24 }}>This service may have been removed or is no longer available.</p>
          <Link href="/browse"><button className="btn btn-primary">Browse Services</button></Link>
        </div>
      </div>
      <Footer />
    </>
  );

  const priceLabel = service.priceType === 'hourly' ? '/hr' : service.priceType === 'negotiable' ? ' (negotiable)' : ' fixed';

  return (
    <>
      <Navbar />
      <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>

        {/* Hero Banner */}
        <div style={{ background: coverGrad, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />
          <div style={{ position: 'absolute', top: '50%', right: 120, transform: 'translateY(-50%)', fontSize: 120, opacity: 0.15 }}>
            {service.category?.icon}
          </div>
          <div className="container" style={{ position: 'relative', zIndex: 1, padding: '48px 24px 40px' }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
              <Link href="/" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>Home</Link>
              <span>›</span>
              <Link href="/browse" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>Browse</Link>
              <span>›</span>
              <Link href={`/browse?category=${service.category?._id}`} style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>{service.category?.name}</Link>
              <span>›</span>
              <span style={{ color: 'white' }}>{service.title}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 12px', marginBottom: 12, fontSize: 13, color: 'white' }}>
                  <span>{service.category?.icon}</span>
                  <span>{service.category?.name}</span>
                </div>
                <h1 style={{ fontSize: 32, fontWeight: 800, color: 'white', lineHeight: 1.2, marginBottom: 12 }}>{service.title}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'white' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.3)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 12 }}>
                      {providerInitials}
                    </div>
                    <span style={{ fontSize: 14 }}>{service.provider?.name}</span>
                    {service.provider?.location && <span style={{ opacity: 0.8, fontSize: 13 }}>· {service.provider.location}</span>}
                  </div>
                  {service.reviewCount > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'white', fontSize: 14 }}>
                      <Stars rating={service.rating} />
                      <span style={{ fontWeight: 600 }}>{service.rating.toFixed(1)}</span>
                      <span style={{ opacity: 0.8 }}>({service.reviewCount} reviews)</span>
                    </div>
                  )}
                  {!service.isActive && (
                    <span style={{ background: '#fee2e2', color: '#ef4444', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Unavailable</span>
                  )}
                </div>
              </div>

              {/* Price box */}
              <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', borderRadius: 16, padding: '20px 28px', minWidth: 180, textAlign: 'center', border: '1px solid rgba(255,255,255,0.25)' }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>Starting from</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: 'white', lineHeight: 1 }}>${service.price}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{priceLabel}</div>
                {service.deliveryTime && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 8 }}>⏱ {service.deliveryTime}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="container service-detail-grid" style={{ padding: '32px 24px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start' }}>

          {/* Left column */}
          <div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid var(--border)' }}>
              {([
                ['overview', '📋 Overview'],
                ['details',  '🔧 Details'],
                ...(service.videoUrl ? [['video', '🎬 Video']] : []),
                ['provider', '👤 Provider'],
              ] as [string, string][]).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                  style={{
                    padding: '10px 20px', fontWeight: 600, fontSize: 14, background: 'none', border: 'none',
                    borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                    color: activeTab === tab ? 'var(--primary)' : 'var(--text-light)',
                    marginBottom: -2, cursor: 'pointer', transition: 'all 0.2s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Overview */}
            {activeTab === 'overview' && (
              <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                <div className="content-card" style={{ marginBottom: 20 }}>
                  <h3 style={{ marginBottom: 12, fontSize: 17 }}>About this service</h3>
                  <p style={{ color: 'var(--text)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{service.description}</p>
                </div>
                {service.tags?.length > 0 && (
                  <div className="content-card">
                    <h3 style={{ marginBottom: 12, fontSize: 17 }}>Tags</h3>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {service.tags.map(tag => <span key={tag} className="ptag" style={{ fontSize: 13 }}>{tag}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Details */}
            {activeTab === 'details' && (
              <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                <div className="content-card">
                  <h3 style={{ marginBottom: 4, fontSize: 17 }}>Service Specifications</h3>
                  <p style={{ color: 'var(--text-light)', fontSize: 13, marginBottom: 16 }}>Details provided by the service provider</p>
                  <div style={{ borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-light)', fontSize: 14 }}>Category</span>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{service.category?.icon} {service.category?.name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-light)', fontSize: 14 }}>Price</span>
                      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--primary)' }}>${service.price}{priceLabel}</span>
                    </div>
                    {service.deliveryTime && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ color: 'var(--text-light)', fontSize: 14 }}>Delivery Time</span>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{service.deliveryTime}</span>
                      </div>
                    )}
                  </div>
                  {service.category?.fields?.length > 0 && Object.keys(service.customFields ?? {}).length > 0 && (
                    <>
                      <h4 style={{ margin: '20px 0 4px', fontSize: 14, color: 'var(--text-light)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {service.category.name} Details
                      </h4>
                      {service.category.fields.map(field => (
                        <CustomFieldValue key={field.name} field={field} value={service.customFields?.[field.name]} />
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Video */}
            {activeTab === 'video' && service.videoUrl && (
              <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                <div className="content-card">
                  <h3 style={{ marginBottom: 16, fontSize: 17 }}>Work Video</h3>
                  <VideoEmbed url={service.videoUrl} />
                  <p style={{ marginTop: 12, fontSize: 13, color: 'var(--text-light)', textAlign: 'center' }}>
                    Video shared by {service.provider?.name}
                  </p>
                </div>
              </div>
            )}

            {/* Provider */}
            {activeTab === 'provider' && (
              <div style={{ animation: 'fadeInUp 0.3s ease' }}>
                <div className="content-card">
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700, fontSize: 22 }}>
                      {providerInitials}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 18, marginBottom: 4 }}>{service.provider?.name}</h3>
                      {service.provider?.location && <p style={{ color: 'var(--text-light)', fontSize: 14, marginBottom: 6 }}>📍 {service.provider.location}</p>}
                      {service.provider?.reviewCount > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Stars rating={service.provider.rating} />
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{service.provider.rating.toFixed(1)}</span>
                          <span style={{ color: 'var(--text-light)', fontSize: 13 }}>({service.provider.reviewCount} reviews)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {service.provider?.bio && <p style={{ color: 'var(--text)', lineHeight: 1.7, marginBottom: 16, fontSize: 14 }}>{service.provider.bio}</p>}
                  {service.provider?.skills?.length > 0 && (
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-light)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skills</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {service.provider.skills.map(skill => <span key={skill} className="ptag">{skill}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="service-detail-sidebar" style={{ position: 'sticky', top: 84 }}>
            <div className="content-card" style={{ border: '2px solid var(--border)', padding: 24 }}>

              {/* Price */}
              <div style={{ textAlign: 'center', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 4 }}>Price</div>
                <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>${service.price}</div>
                <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 4 }}>{priceLabel}</div>
              </div>

              {/* Meta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20, fontSize: 14 }}>
                {service.deliveryTime && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>⏱</span><span style={{ color: 'var(--text-light)' }}>Delivery:</span>
                    <span style={{ fontWeight: 600 }}>{service.deliveryTime}</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{service.category?.icon}</span><span style={{ color: 'var(--text-light)' }}>Category:</span>
                  <span style={{ fontWeight: 600 }}>{service.category?.name}</span>
                </div>
                {service.reviewCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>⭐</span><span style={{ color: 'var(--text-light)' }}>Rating:</span>
                    <span style={{ fontWeight: 600 }}>{service.rating.toFixed(1)} ({service.reviewCount})</span>
                  </div>
                )}
              </div>

              {/* Unavailable badge */}
              {!service.isActive && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 12, textAlign: 'center', color: '#ef4444', fontWeight: 600, fontSize: 14 }}>
                  ⚠️ Currently Unavailable
                </div>
              )}

              {/* Contact buttons — reveal on click */}
              {service.isActive && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {service.mobile && (
                    <RevealNumberBtn
                      serviceId={service._id}
                      contactType="mobile"
                      icon="📞"
                      label="Show Mobile Number"
                      actionLabel="Call"
                      color="#16a34a"
                      bg="#f0fdf4"
                      border="#86efac"
                      href={n => `tel:${n}`}
                    />
                  )}
                  {service.whatsapp && (
                    <RevealNumberBtn
                      serviceId={service._id}
                      contactType="whatsapp"
                      icon="💬"
                      label="Show WhatsApp Number"
                      actionLabel="Chat"
                      color="#15803d"
                      bg="#f0fdf4"
                      border="#4ade80"
                      href={n => `https://wa.me/${n.replace(/[^\d]/g, '')}`}
                    />
                  )}
                  {!service.mobile && !service.whatsapp && (
                    <p style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: 13 }}>No contact info available</p>
                  )}
                </div>
              )}
            </div>

            {/* Provider mini card */}
            <div className="content-card" style={{ marginTop: 16, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700, fontSize: 15 }}>
                  {providerInitials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{service.provider?.name}</div>
                  {service.provider?.location && <div style={{ fontSize: 12, color: 'var(--text-light)' }}>📍 {service.provider.location}</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
