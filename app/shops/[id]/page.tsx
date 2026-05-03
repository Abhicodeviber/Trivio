'use client';
import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import ChatButton from '@/components/chat/ChatButton';

interface Vendor {
  _id: string; shopName: string; ownerName: string;
  city: string; address?: string;
  description: string; logo: string; photos: string[];
  youtube?: string; instagram?: string;
  categories: string[]; isActive: boolean;
  rating: number; reviewCount: number; createdAt: string;
  location?: { coordinates: [number, number] }; // [lng, lat]
}

interface Product {
  _id: string; title: string; description: string; category: string;
  price: number; unit: string; images: string[]; tags: string[];
  inStock: boolean; createdAt: string;
}

const UNIT_LABELS: Record<string, string> = { kg:'kg', piece:'pc', dozen:'doz', litre:'L', pack:'pack', other:'' };
const SORT_OPTIONS = [
  { value:'createdAt', label:'Newest First' },
  { value:'price_asc', label:'Price: Low → High' },
  { value:'price_desc', label:'Price: High → Low' },
];

/* ── YouTube embed id ── */
function ytId(url: string) {
  return url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1] ?? null;
}

/* ── Lightbox ── */
function Lightbox({ photos, idx, onClose }: { photos: string[]; idx: number; onClose: () => void }) {
  const [cur, setCur] = useState(idx);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCur(c => (c + 1) % photos.length);
      if (e.key === 'ArrowLeft')  setCur(c => (c - 1 + photos.length) % photos.length);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [photos.length, onClose]);

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.92)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
      <button onClick={e => { e.stopPropagation(); setCur(c => (c - 1 + photos.length) % photos.length); }}
        style={{ position:'absolute', left:24, background:'rgba(255,255,255,.12)', border:'none', color:'#fff', fontSize:28, width:48, height:48, borderRadius:'50%', cursor:'pointer' }}>‹</button>
      <img src={photos[cur]} alt="" onClick={e => e.stopPropagation()}
        style={{ maxWidth:'88vw', maxHeight:'86vh', objectFit:'contain', borderRadius:12, boxShadow:'0 24px 80px rgba(0,0,0,.6)' }} />
      <button onClick={e => { e.stopPropagation(); setCur(c => (c + 1) % photos.length); }}
        style={{ position:'absolute', right:24, background:'rgba(255,255,255,.12)', border:'none', color:'#fff', fontSize:28, width:48, height:48, borderRadius:'50%', cursor:'pointer' }}>›</button>
      <button onClick={onClose}
        style={{ position:'absolute', top:20, right:20, background:'rgba(255,255,255,.12)', border:'none', color:'#fff', fontSize:20, width:40, height:40, borderRadius:'50%', cursor:'pointer' }}>✕</button>
      <div style={{ position:'absolute', bottom:20, left:'50%', transform:'translateX(-50%)', color:'rgba(255,255,255,.5)', fontSize:13 }}>
        {cur + 1} / {photos.length} · Arrow keys to navigate · Esc to close
      </div>
    </div>
  );
}

/* ── Reveal Contact Button ── */
function RevealContactBtn({ productId, vendorId }: { productId: string; vendorId: string }) {
  const [revealed, setRevealed] = useState(false);
  const [mobile, setMobile]     = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState('');

  async function reveal() {
    setLoading(true); setErr('');
    try {
      const res  = await fetch('/api/vendor-leads', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ productId, vendorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setMobile(data.mobile ?? '');
      setWhatsapp(data.whatsapp ?? '');
      setRevealed(true);
    } catch (e: unknown) { setErr((e as Error).message); }
    finally { setLoading(false); }
  }

  if (revealed) return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {mobile   && <a href={`tel:${mobile}`} className="btn btn-primary btn-sm">📞 {mobile}</a>}
      {whatsapp && <a href={`https://wa.me/${whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
        className="btn btn-sm" style={{ background:'#25d366', color:'#fff' }}>💬 {whatsapp}</a>}
    </div>
  );
  return (
    <>
      {err && <p style={{ color:'#ef4444', fontSize:12, marginBottom:4 }}>{err}</p>}
      <button className="btn btn-sm btn-primary btn-full" onClick={reveal} disabled={loading}>
        {loading ? '…' : '📞 Contact'}
      </button>
    </>
  );
}

/* ── Product Card ── */
function ProductCard({ p, vendorId, idx }: { p: Product; vendorId: string; idx: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="shop-product-card" style={{ animationDelay:`${idx * 0.06}s` }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <Link href={`/products/${p._id}`} style={{ display:'block', textDecoration:'none' }}>
        <div className="shop-product-img">
          {p.images.length > 0
            ? <img src={p.images[0]} alt={p.title} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s ease', transform: hovered ? 'scale(1.07)' : 'scale(1)' }} />
            : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:44, background:'#f0fdf4' }}>🛍️</div>
          }
          <div style={{ position:'absolute', top:8, left:8 }}>
            <span style={{ background: p.inStock ? '#dcfce7' : '#fee2e2', color: p.inStock ? '#15803d' : '#dc2626', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
              {p.inStock ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>
      </Link>
      <div style={{ padding:'14px 14px 12px' }}>
        {p.category && <span style={{ fontSize:11, fontWeight:600, color:'#15803d', background:'#f0fdf4', padding:'2px 8px', borderRadius:20, display:'inline-block', marginBottom:6 }}>{p.category}</span>}
        <Link href={`/products/${p._id}`} style={{ textDecoration:'none' }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'var(--dark)', margin:'0 0 4px', lineHeight:1.35, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as const, overflow:'hidden' }}>{p.title}</h3>
        </Link>
        <div style={{ display:'flex', alignItems:'baseline', gap:4, margin:'6px 0 10px' }}>
          <span style={{ fontSize:18, fontWeight:800, color:'#15803d' }}>₹{p.price}</span>
          <span style={{ fontSize:12, color:'var(--text-light)' }}>/{UNIT_LABELS[p.unit] ?? p.unit}</span>
        </div>
        <RevealContactBtn productId={p._id} vendorId={vendorId} />
      </div>
    </div>
  );
}

/* ── Main ── */
function ShopContent() {
  const { id }       = useParams<{ id: string }>();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [vendor,  setVendor]  = useState<Vendor | null>(null);
  const [products,setProducts]= useState<Product[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [prodLoad,setProdLoad]= useState(true);
  const [notFound,setNotFound]= useState(false);
  const [activeTab, setActiveTab] = useState<'products'|'gallery'|'about'>('products');
  const [lightbox, setLightbox]   = useState<number | null>(null);

  const [search,   setSearch]   = useState(searchParams.get('q')    ?? '');
  const [category, setCategory] = useState(searchParams.get('cat')  ?? '');
  const [sort,     setSort]     = useState(searchParams.get('sort') ?? 'createdAt');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    fetch(`/api/vendors/${id}`)
      .then(r => r.json())
      .then(d => { if (d.error) setNotFound(true); else setVendor(d.vendor); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const fetchProducts = useCallback((pg = 1) => {
    if (!id) return;
    setProdLoad(true);
    const p = new URLSearchParams({ vendorId: id, page: String(pg), limit:'12', sort });
    if (search)   p.set('q', search);
    if (category) p.set('category', category);
    fetch(`/api/products?${p}`)
      .then(r => r.json())
      .then(d => { setProducts(d.products ?? []); setTotal(d.total ?? 0); setPages(d.pages ?? 1); setPage(pg); })
      .finally(() => setProdLoad(false));
  }, [id, search, category, sort]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchProducts(1), 300);
    return () => clearTimeout(debounceRef.current);
  }, [fetchProducts]);

  const since    = vendor ? new Date(vendor.createdAt).getFullYear() : '';
  const initials = vendor?.shopName.slice(0, 2).toUpperCase() ?? '??';
  const photos   = vendor?.photos?.filter(Boolean) ?? [];
  const coverImg = photos[0] ?? null;

  if (loading) return (
    <><Navbar />
      <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
        <div className="shop-spinner" /><p style={{ color:'var(--text-light)' }}>Loading shop…</p>
      </div><Footer /></>
  );

  if (notFound || !vendor) return (
    <><Navbar />
      <div style={{ minHeight:'60vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:24 }}>
        <div style={{ fontSize:64 }}>🏪</div>
        <h2>Shop not found</h2>
        <p style={{ color:'var(--text-light)' }}>This shop may have been removed or the link is incorrect.</p>
        <Link href="/products"><button className="btn btn-primary">← Browse All Shops</button></Link>
      </div><Footer /></>
  );

  return (
    <>
      <Navbar />
      {lightbox !== null && <Lightbox photos={photos} idx={lightbox} onClose={() => setLightbox(null)} />}

      <main style={{ background:'#f8fafc', minHeight:'100vh' }}>

        {/* ══════════════════════════════════════════
            HERO — full-width cover + overlay info
        ══════════════════════════════════════════ */}
        <div className="sdp-hero">
          {/* Cover image / gradient */}
          <div className="sdp-cover">
            {coverImg
              ? <img src={coverImg} alt="Shop cover" className="sdp-cover-img" />
              : <div className="sdp-cover-gradient" />
            }
            <div className="sdp-cover-overlay" />
          </div>

          {/* Floating photo strip on cover */}
          {photos.length > 1 && (
            <div className="sdp-photo-strip">
              {photos.slice(0, 5).map((ph, i) => (
                <button key={i} className="sdp-strip-thumb" onClick={() => setLightbox(i)}>
                  <img src={ph} alt={`Photo ${i+1}`} />
                  {i === 4 && photos.length > 5 && (
                    <div className="sdp-strip-more">+{photos.length - 5}</div>
                  )}
                </button>
              ))}
              <button className="sdp-strip-all" onClick={() => { setActiveTab('gallery'); }}>
                🖼️ All Photos
              </button>
            </div>
          )}

          {/* Info bar below cover */}
          <div className="sdp-info-bar">
            <div className="container sdp-info-inner">

              {/* Logo */}
              <div className="sdp-logo-wrap">
                {vendor.logo
                  ? <img src={vendor.logo} alt={vendor.shopName} className="sdp-logo-img" />
                  : <div className="sdp-logo-placeholder">{initials}</div>
                }
                <span className="sdp-online-dot" title="Active" />
              </div>

              {/* Name + meta */}
              <div className="sdp-name-block">
                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                  <h1 className="sdp-shop-name">{vendor.shopName}</h1>
                  <span className="sdp-verified">✓ Verified</span>
                </div>
                <div className="sdp-meta">
                  <span>👤 {vendor.ownerName}</span>
                  {(vendor.city || vendor.address) && (
                    <span>📍 {[vendor.city, vendor.address].filter(Boolean).join(', ')}</span>
                  )}
                  {since && <span>📅 Since {since}</span>}
                  {vendor.location?.coordinates && (
                    <a
                      href={`https://www.google.com/maps?q=${vendor.location.coordinates[1]},${vendor.location.coordinates[0]}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontSize:12, color:'#0ea5e9', textDecoration:'none', fontWeight:600, display:'inline-flex', alignItems:'center', gap:3 }}>
                      🗺️ View on Map
                    </a>
                  )}
                  {vendor.categories.slice(0,3).map(c => (
                    <span key={c} className="sdp-cat-chip">{c}</span>
                  ))}
                </div>
                {/* Social links + Chat */}
                <div className="sdp-social">
                  <ChatButton
                    targetUserId={vendor._id}
                    targetRole="vendor"
                    targetName={vendor.shopName}
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                  />
                  {vendor.youtube && (
                    <a href={vendor.youtube} target="_blank" rel="noopener noreferrer" className="sdp-social-btn sdp-yt">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19.6 3H4.4A3.4 3.4 0 0 0 1 6.4v11.2A3.4 3.4 0 0 0 4.4 21h15.2a3.4 3.4 0 0 0 3.4-3.4V6.4A3.4 3.4 0 0 0 19.6 3ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z"/></svg>
                      YouTube
                    </a>
                  )}
                  {vendor.instagram && (
                    <a href={vendor.instagram} target="_blank" rel="noopener noreferrer" className="sdp-social-btn sdp-ig">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                      Instagram
                    </a>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="sdp-stats">
                <div className="sdp-stat"><strong>{total}</strong><span>Products</span></div>
                <div className="sdp-stat-div" />
                <div className="sdp-stat"><strong>{vendor.rating > 0 ? vendor.rating.toFixed(1) : '—'}</strong><span>Rating</span></div>
                <div className="sdp-stat-div" />
                <div className="sdp-stat"><strong>{vendor.reviewCount}</strong><span>Reviews</span></div>
              </div>

            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            STICKY NAV TABS + FILTERS
        ══════════════════════════════════════════ */}
        <div className="sdp-toolbar">
          <div className="container sdp-toolbar-inner">
            <div className="sdp-tabs">
              <button className={`sdp-tab${activeTab==='products'?' active':''}`} onClick={() => setActiveTab('products')}>
                🛒 Products {total > 0 && `(${total})`}
              </button>
              {photos.length > 0 && (
                <button className={`sdp-tab${activeTab==='gallery'?' active':''}`} onClick={() => setActiveTab('gallery')}>
                  🖼️ Gallery ({photos.length})
                </button>
              )}
              <button className={`sdp-tab${activeTab==='about'?' active':''}`} onClick={() => setActiveTab('about')}>
                ℹ️ About
              </button>
            </div>

            {activeTab === 'products' && (
              <div className="sdp-filters">
                <div className="sdp-search-box">
                  <svg width="15" height="15" viewBox="0 0 20 20" fill="none"><circle cx="9" cy="9" r="6" stroke="#9ca3af" strokeWidth="2"/><path d="M13.5 13.5L17 17" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/></svg>
                  <input className="sdp-search-input" placeholder="Search products…"
                    value={search} onChange={e => setSearch(e.target.value)} />
                  {search && <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:'#9ca3af', fontSize:16, padding:'0 2px' }}>×</button>}
                </div>
                {vendor.categories.length > 0 && (
                  <select value={category} onChange={e => setCategory(e.target.value)} className="sdp-select">
                    <option value="">All</option>
                    {vendor.categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
                <select value={sort} onChange={e => setSort(e.target.value)} className="sdp-select">
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════
            CONTENT
        ══════════════════════════════════════════ */}
        <div className="container sdp-body">

          {/* PRODUCTS */}
          {activeTab === 'products' && (
            <>
              {prodLoad ? (
                <div className="shop-products-grid">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="shop-product-card" style={{ opacity:.4 }}>
                      <div style={{ height:200, background:'#e2e8f0' }} />
                      <div style={{ padding:14 }}><div style={{ height:14, background:'#e2e8f0', borderRadius:4, marginBottom:8 }} /></div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div style={{ textAlign:'center', padding:'80px 24px', color:'var(--text-light)' }}>
                  <div style={{ fontSize:56, marginBottom:16 }}>📦</div>
                  <h3 style={{ marginBottom:8, color:'var(--dark)' }}>{search || category ? 'No products match' : 'No products yet'}</h3>
                  <p>{search || category ? 'Try clearing filters.' : 'This shop has no products yet.'}</p>
                  {(search || category) && <button className="btn btn-outline" style={{ marginTop:16 }} onClick={() => { setSearch(''); setCategory(''); }}>Clear Filters</button>}
                </div>
              ) : (
                <>
                  {(search || category) && (
                    <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
                      <span style={{ fontSize:13, color:'var(--text-light)' }}>{total} result{total!==1?'s':''} for</span>
                      {search   && <span className="shop-filter-chip">{search}<button onClick={() => setSearch('')}>×</button></span>}
                      {category && <span className="shop-filter-chip">{category}<button onClick={() => setCategory('')}>×</button></span>}
                    </div>
                  )}
                  <div className="shop-products-grid">
                    {products.map((p, i) => <ProductCard key={p._id} p={p} vendorId={vendor._id} idx={i} />)}
                  </div>
                  {pages > 1 && (
                    <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:40 }}>
                      <button className="btn btn-outline btn-sm" disabled={page===1} onClick={() => fetchProducts(page-1)}>← Prev</button>
                      {Array.from({ length: pages }, (_, i) => i+1).map(pg => (
                        <button key={pg} className={`btn btn-sm ${pg===page?'btn-primary':'btn-outline'}`} onClick={() => fetchProducts(pg)}>{pg}</button>
                      ))}
                      <button className="btn btn-outline btn-sm" disabled={page===pages} onClick={() => fetchProducts(page+1)}>Next →</button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* GALLERY */}
          {activeTab === 'gallery' && (
            <div>
              {photos.length === 0 ? (
                <div style={{ textAlign:'center', padding:'80px 24px', color:'var(--text-light)' }}>
                  <div style={{ fontSize:48, marginBottom:12 }}>🖼️</div>
                  <p>No photos added yet.</p>
                </div>
              ) : (
                <>
                  <p style={{ fontSize:13, color:'var(--text-light)', marginBottom:20 }}>Click any photo to view full size</p>
                  <div className="sdp-gallery-grid">
                    {photos.map((ph, i) => (
                      <button key={i} className="sdp-gallery-thumb" onClick={() => setLightbox(i)}>
                        <img src={ph} alt={`Shop photo ${i+1}`} />
                        <div className="sdp-gallery-hover">🔍</div>
                      </button>
                    ))}
                  </div>
                  {/* YouTube embed */}
                  {vendor.youtube && ytId(vendor.youtube) && (
                    <div style={{ marginTop:40 }}>
                      <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16, color:'var(--dark)' }}>📺 Our YouTube Channel</h3>
                      <div className="sdp-yt-embed">
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId(vendor.youtube)}`}
                          title="YouTube" frameBorder="0" allowFullScreen
                          style={{ width:'100%', height:'100%', borderRadius:12, border:'none' }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ABOUT */}
          {activeTab === 'about' && (
            <div className="sdp-about-grid">
              <div className="content-card">
                <h2 style={{ fontSize:18, fontWeight:700, marginBottom:20 }}>🏪 About {vendor.shopName}</h2>
                {vendor.description
                  ? <p style={{ fontSize:15, lineHeight:1.8, color:'var(--text)', marginBottom:24 }}>{vendor.description}</p>
                  : <p style={{ color:'var(--text-light)', marginBottom:24 }}>No description provided.</p>
                }
                <div className="sdp-about-rows">
                  <div className="sdp-about-row"><span>👤</span><div><strong>Owner</strong><span>{vendor.ownerName}</span></div></div>
                  {(vendor.city || vendor.address || vendor.location?.coordinates) && (
                    <div className="sdp-about-row">
                      <span>📍</span>
                      <div>
                        <strong>Location</strong>
                        {(vendor.city || vendor.address) && (
                          <span>{[vendor.city, vendor.address].filter(Boolean).join(', ')}</span>
                        )}
                        {vendor.location?.coordinates && (
                          <a
                            href={`https://www.google.com/maps?q=${vendor.location.coordinates[1]},${vendor.location.coordinates[0]}`}
                            target="_blank" rel="noopener noreferrer"
                            style={{ fontSize:13, color:'#0ea5e9', textDecoration:'none', fontWeight:600, marginTop:4, display:'inline-flex', alignItems:'center', gap:4 }}>
                            🗺️ Open in Google Maps ↗
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {since && <div className="sdp-about-row"><span>📅</span><div><strong>On ServeHub since</strong><span>{since}</span></div></div>}
                  {vendor.categories.length > 0 && (
                    <div className="sdp-about-row">
                      <span>🏷️</span>
                      <div>
                        <strong>Categories</strong>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
                          {vendor.categories.map(c => <span key={c} style={{ background:'#dcfce7', color:'#15803d', padding:'2px 10px', borderRadius:20, fontSize:12, fontWeight:600 }}>{c}</span>)}
                        </div>
                      </div>
                    </div>
                  )}
                  {(vendor.youtube || vendor.instagram) && (
                    <div className="sdp-about-row">
                      <span>🔗</span>
                      <div>
                        <strong>Social Links</strong>
                        <div style={{ display:'flex', gap:10, marginTop:8 }}>
                          {vendor.youtube   && <a href={vendor.youtube}   target="_blank" rel="noopener noreferrer" className="sdp-social-btn sdp-yt">▶ YouTube</a>}
                          {vendor.instagram && <a href={vendor.instagram} target="_blank" rel="noopener noreferrer" className="sdp-social-btn sdp-ig">📷 Instagram</a>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {/* Contact CTA */}
                <div className="content-card" style={{ background:'linear-gradient(135deg,#f0fdf4,#dcfce7)', border:'1px solid #86efac' }}>
                  <h3 style={{ fontSize:16, fontWeight:700, marginBottom:12, color:'#14532d' }}>📞 Contact Shop</h3>
                  <p style={{ fontSize:13, color:'#166534', lineHeight:1.6, marginBottom:16 }}>Open a product and tap "Contact" to get the vendor's phone &amp; WhatsApp.</p>
                  <button className="btn btn-primary btn-full" onClick={() => setActiveTab('products')}
                    style={{ background:'linear-gradient(135deg,#16a34a,#15803d)' }}>🛒 Browse Products</button>
                </div>
                {/* Stats */}
                <div className="content-card">
                  <h3 style={{ fontSize:14, fontWeight:700, marginBottom:16 }}>Shop Stats</h3>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    {[
                      { icon:'📦', label:'Products', val:total },
                      { icon:'⭐', label:'Rating',   val: vendor.rating > 0 ? vendor.rating.toFixed(1) : '—' },
                      { icon:'💬', label:'Reviews',  val: vendor.reviewCount },
                      { icon:'🖼️', label:'Photos',   val: photos.length },
                    ].map(s => (
                      <div key={s.label} style={{ background:'#f8fafc', borderRadius:10, padding:'12px', textAlign:'center' }}>
                        <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
                        <div style={{ fontSize:18, fontWeight:800, color:'var(--dark)' }}>{s.val}</div>
                        <div style={{ fontSize:12, color:'var(--text-light)' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280' }}>Loading…</div>}>
      <ShopContent />
    </Suspense>
  );
}
