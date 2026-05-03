'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Vendor {
  _id: string; shopName: string; ownerName: string; city: string;
  logo?: string; rating: number; reviewCount: number;
}
interface Product {
  _id: string; title: string; description: string; category: string;
  price: number; unit: string; images: string[]; tags: string[];
  inStock: boolean; vendor: Vendor; customFields: Record<string, unknown>;
  createdAt: string;
}

function RevealContactBtn({ productId, vendorId }: { productId: string; vendorId: string }) {
  const [revealed, setRevealed]     = useState(false);
  const [mobile, setMobile]         = useState('');
  const [whatsapp, setWhatsapp]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  async function reveal() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/vendor-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, vendorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to get contact');
      setMobile(data.mobile ?? '');
      setWhatsapp(data.whatsapp ?? '');
      setRevealed(true);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (revealed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {mobile && (
          <a href={`tel:${mobile}`} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            📞 Call: {mobile}
          </a>
        )}
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
            className="btn" style={{ background: '#25d366', color: '#fff', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            💬 WhatsApp: {whatsapp}
          </a>
        )}
        {!mobile && !whatsapp && (
          <p style={{ color: 'var(--text-light)', fontSize: 14 }}>No contact info available.</p>
        )}
      </div>
    );
  }

  return (
    <div>
      {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 8 }}>{error}</p>}
      <button className="btn btn-primary btn-full" onClick={reveal} disabled={loading}
        style={{ opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Getting contact…' : '📞 Show Contact Info'}
      </button>
      <p style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 6, textAlign: 'center' }}>
        Contact is revealed once — vendor is notified of your interest.
      </p>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx]   = useState(0);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(data => setProduct(data.product ?? null))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 40 }}>⏳</div>
        <p style={{ color: 'var(--text-light)' }}>Loading product…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '60px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 56 }}>😕</div>
        <h2>Product not found</h2>
        <Link href="/products" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>← Back to Products</Link>
      </div>
    );
  }

  const customEntries = Object.entries(product.customFields ?? {}).filter(([, v]) => v);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Breadcrumb */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
        <div className="container" style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-light)', alignItems: 'center' }}>
          <Link href="/" style={{ color: 'var(--primary)' }}>Home</Link>
          <span>›</span>
          <Link href="/products" style={{ color: 'var(--primary)' }}>Products</Link>
          {product.category && <><span>›</span><span>{product.category}</span></>}
          <span>›</span>
          <span style={{ color: 'var(--dark)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.title}</span>
        </div>
      </div>

      <div className="container" style={{ padding: '24px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 24 }}>

          {/* Left: Images */}
          <div>
            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 12, aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              {product.images.length > 0 ? (
                <img src={product.images[imgIdx]} alt={product.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ fontSize: 80, opacity: 0.3 }}>🛍️</div>
              )}
              {!product.inStock && (
                <div style={{ position: 'absolute', top: 12, right: 12, background: '#ef4444', color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  Out of Stock
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
                {product.images.map((img, i) => (
                  <div key={i} onClick={() => setImgIdx(i)} style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', border: `2px solid ${imgIdx === i ? 'var(--primary)' : 'var(--border)'}`, cursor: 'pointer', flexShrink: 0 }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="content-card">
              {product.category && (
                <span className="ptag" style={{ fontSize: 12, marginBottom: 8, display: 'inline-block' }}>{product.category}</span>
              )}
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--dark)', margin: '0 0 8px' }}>{product.title}</h1>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)' }}>₹{product.price}</span>
                <span style={{ color: 'var(--text-light)', fontSize: 14 }}>per {product.unit}</span>
                <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: product.inStock ? '#16a34a' : '#ef4444' }}>
                  {product.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                </span>
              </div>

              {product.description && (
                <p style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.6, margin: '0 0 12px' }}>{product.description}</p>
              )}

              {product.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {product.tags.map(t => <span key={t} className="ptag" style={{ fontSize: 12 }}>{t}</span>)}
                </div>
              )}
            </div>

            {/* Custom fields */}
            {customEntries.length > 0 && (
              <div className="content-card">
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>Product Details</h3>
                <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
                  <tbody>
                    {customEntries.map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '8px 0', color: 'var(--text-light)', width: '45%', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</td>
                        <td style={{ padding: '8px 0', fontWeight: 500 }}>{String(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Contact card */}
            <div className="content-card">
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>Contact Vendor</h3>
              <RevealContactBtn productId={product._id} vendorId={product.vendor?._id} />
            </div>

            {/* Vendor card */}
            {product.vendor && (
              <div className="content-card">
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>About the Shop</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#14532d,#166534)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                    {product.vendor.logo
                      ? <img src={product.vendor.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      : product.vendor.shopName?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{product.vendor.shopName}</div>
                    {product.vendor.ownerName && <div style={{ fontSize: 13, color: 'var(--text-light)' }}>by {product.vendor.ownerName}</div>}
                  </div>
                </div>
                {product.vendor.city && (
                  <p style={{ fontSize: 13, color: 'var(--text-light)', margin: '0 0 6px' }}>📍 {product.vendor.city}</p>
                )}
                {product.vendor.rating > 0 && (
                  <p style={{ fontSize: 13, margin: 0 }}>⭐ {product.vendor.rating.toFixed(1)} · {product.vendor.reviewCount} reviews</p>
                )}
                <Link href={`/shops/${product.vendor._id}`} style={{ fontSize: 13, color: '#16a34a', marginTop: 8, display: 'inline-block' }}>
                  Visit Shop →
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
