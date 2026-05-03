'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

/* ──────────────────────────────────────────
   Types
────────────────────────────────────────── */
interface Vendor {
  _id: string;
  shopName: string;
  ownerName: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  city: string;
  address?: string;
  description: string;
  logo: string;
  categories: string[];
  isActive: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

interface Product {
  _id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  images: string[];
  tags: string[];
  inStock: boolean;
  createdAt: string;
}

const SHOP_GRADIENTS = [
  'linear-gradient(135deg,#14532d 0%,#16a34a 60%,#4ade80 100%)',
  'linear-gradient(135deg,#065f46 0%,#059669 60%,#34d399 100%)',
  'linear-gradient(135deg,#166534 0%,#15803d 60%,#86efac 100%)',
];

const UNIT_LABELS: Record<string, string> = {
  kg: 'kg', piece: 'pc', dozen: 'doz', litre: 'L', pack: 'pack', other: ''
};

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
];

/* ──────────────────────────────────────────
   Reveal Contact Button
────────────────────────────────────────── */
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, vendorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed');
      setMobile(data.mobile ?? '');
      setWhatsapp(data.whatsapp ?? '');
      setRevealed(true);
    } catch (e: unknown) {
      setErr((e as Error).message);
    } finally { setLoading(false); }
  }

  if (revealed) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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

/* ──────────────────────────────────────────
   Product Card
────────────────────────────────────────── */
function ProductCard({ p, vendorId, idx }: { p: Product; vendorId: string; idx: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="shop-product-card"
      style={{ animationDelay: `${idx * 0.06}s` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <Link href={`/products/${p._id}`} style={{ display:'block', textDecoration:'none' }}>
        <div className="shop-product-img">
          {p.images.length > 0
            ? <img src={p.images[0]} alt={p.title} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s ease', transform: hovered ? 'scale(1.07)' : 'scale(1)' }} />
            : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:44, background:'#f0fdf4' }}>🛍️</div>
          }
          {!p.inStock && (
            <div style={{ position:'absolute', top:8, left:8, background:'#ef4444', color:'#fff', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
              Out of stock
            </div>
          )}
          {p.inStock && (
            <div style={{ position:'absolute', top:8, left:8, background:'#dcfce7', color:'#15803d', padding:'2px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
              In Stock
            </div>
          )}
        </div>
      </Link>

      <div style={{ padding:'14px 14px 12px' }}>
        {p.category && (
          <span style={{ fontSize:11, fontWeight:600, color:'#15803d', background:'#f0fdf4', padding:'2px 8px', borderRadius:20, display:'inline-block', marginBottom:6 }}>
            {p.category}
          </span>
        )}
        <Link href={`/products/${p._id}`} style={{ textDecoration:'none' }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'var(--dark)', margin:'0 0 4px', lineHeight:1.35,
            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' as const, overflow:'hidden' }}>
            {p.title}
          </h3>
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

/* ──────────────────────────────────────────
   Main Page
────────────────────────────────────────── */
export default function ShopPage() {
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
  const [activeTab, setActiveTab] = useState<'products'|'about'>('products');

  // Filters
  const [search,  setSearch]  = useState(searchParams.get('q') ?? '');
  const [category,setCategory]= useState(searchParams.get('cat') ?? '');
  const [sort,    setSort]    = useState(searchParams.get('sort') ?? 'createdAt');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  /* Load vendor */
  useEffect(() => {
    fetch(`/api/vendors/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setNotFound(true);
        else setVendor(d.vendor);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  /* Load products */
  const fetchProducts = useCallback((pg = 1) => {
    if (!id) return;
    setProdLoad(true);
    const p = new URLSearchParams({ vendorId: id, page: String(pg), limit: '12', sort });
    if (search)   p.set('q', search);
    if (category) p.set('category', category);
    fetch(`/api/products?${p}`)
      .then(r => r.json())
      .then(d => {
        setProducts(d.products ?? []);
        setTotal(d.total ?? 0);
        setPages(d.pages ?? 1);
        setPage(pg);
      })
      .finally(() => setProdLoad(false));
  }, [id, search, category, sort]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchProducts(1), 300);
    return () => clearTimeout(debounceRef.current);
  }, [fetchProducts]);

  /* Gradient based on shop name char code */
  const gradient = vendor
    ? SHOP_GRADIENTS[vendor.shopName.charCodeAt(0) % SHOP_GRADIENTS.length]
    : SHOP_GRADIENTS[0];

  const initials = vendor?.shopName.slice(0, 2).toUpperCase() ?? '??';
  const since    = vendor ? new Date(vendor.createdAt).getFullYear() : '';

  /* ── Loading ── */
  if (loading) return (
    <>
      <Navbar />
      <div style={{ minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
        <div className="shop-spinner" />
        <p style={{ color:'var(--text-light)' }}>Loading shop…</p>
      </div>
      <Footer />
    </>
  );

  /* ── Not found ── */
  if (notFound || !vendor) return (
    <>
      <Navbar />
      <div style={{ minHeight:'60vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, padding:24 }}>
        <div style={{ fontSize:64 }}>🏪</div>
        <h2>Shop not found</h2>
        <p style={{ color:'var(--text-light)' }}>This shop may have been removed or the link is incorrect.</p>
        <Link href="/products"><button className="btn btn-primary">← Browse All Products</button></Link>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <Navbar />
      <main style={{ background:'var(--bg)', minHeight:'100vh' }}>

        {/* ── HERO ── */}
        <div className="shop-hero" style={{ background: gradient }}>
          {/* decorative blobs */}
          <div className="shop-hero-blob shop-hero-blob-1" />
          <div className="shop-hero-blob shop-hero-blob-2" />

          <div className="container">
            {/* Breadcrumb */}
            <div className="shop-breadcrumb">
              <Link href="/">Home</Link> › <Link href="/products">Shops</Link> › {vendor.shopName}
            </div>

            <div className="shop-hero-body">
              {/* Logo */}
              <div className="shop-logo-wrap">
                {vendor.logo
                  ? <img src={vendor.logo} alt={vendor.shopName} className="shop-logo-img" />
                  : <div className="shop-logo-placeholder">{initials}</div>
                }
                <div className="shop-online-dot" title="Active shop" />
              </div>

              {/* Info */}
              <div className="shop-hero-info">
                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:6 }}>
                  <h1 className="shop-hero-name">{vendor.shopName}</h1>
                  <span className="shop-verified-badge">✓ Verified</span>
                </div>
                <p className="shop-hero-owner">by {vendor.ownerName}</p>
                {vendor.description && (
                  <p className="shop-hero-desc">{vendor.description}</p>
                )}
                <div className="shop-hero-meta">
                  {vendor.city && <span>📍 {vendor.city}</span>}
                  {since       && <span>📅 Since {since}</span>}
                  {vendor.categories.length > 0 && (
                    <span>🏷️ {vendor.categories.slice(0, 3).join(' · ')}</span>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="shop-hero-stats">
                <div className="shop-stat">
                  <span className="shop-stat-num">{total}</span>
                  <span className="shop-stat-label">Products</span>
                </div>
                <div className="shop-stat-divider" />
                <div className="shop-stat">
                  <span className="shop-stat-num">{vendor.rating > 0 ? vendor.rating.toFixed(1) : '—'}</span>
                  <span className="shop-stat-label">Rating</span>
                </div>
                <div className="shop-stat-divider" />
                <div className="shop-stat">
                  <span className="shop-stat-num">{vendor.reviewCount}</span>
                  <span className="shop-stat-label">Reviews</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── STICKY TOOLBAR ── */}
        <div className="shop-toolbar">
          <div className="container" style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            {/* Tabs */}
            <div className="shop-tabs">
              <button
                className={`shop-tab ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
              >🛒 Products {total > 0 && `(${total})`}</button>
              <button
                className={`shop-tab ${activeTab === 'about' ? 'active' : ''}`}
                onClick={() => setActiveTab('about')}
              >ℹ️ About Shop</button>
            </div>

            {activeTab === 'products' && (
              <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto', flexWrap:'wrap' }}>
                {/* Search */}
                <div className="shop-search-box">
                  <span style={{ fontSize:15 }}>🔍</span>
                  <input
                    className="shop-search-input"
                    placeholder="Search products…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  {search && (
                    <button onClick={() => setSearch('')} style={{ background:'none', border:'none', color:'var(--text-light)', cursor:'pointer', padding:'0 4px', fontSize:16 }}>×</button>
                  )}
                </div>
                {/* Category filter */}
                {vendor.categories.length > 0 && (
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="shop-filter-select"
                  >
                    <option value="">All Categories</option>
                    {vendor.categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                )}
                {/* Sort */}
                <select value={sort} onChange={e => setSort(e.target.value)} className="shop-filter-select">
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="container" style={{ padding:'32px 24px 64px' }}>

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <>
              {prodLoad ? (
                <div className="shop-products-grid">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="shop-product-card" style={{ opacity:0.4 }}>
                      <div style={{ height:200, background:'#e2e8f0' }} />
                      <div style={{ padding:14 }}>
                        <div style={{ height:14, background:'#e2e8f0', borderRadius:4, marginBottom:8 }} />
                        <div style={{ height:10, background:'#f1f5f9', borderRadius:4, width:'60%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div style={{ textAlign:'center', padding:'80px 24px', color:'var(--text-light)' }}>
                  <div style={{ fontSize:56, marginBottom:16 }}>📦</div>
                  <h3 style={{ marginBottom:8, color:'var(--dark)' }}>
                    {search || category ? 'No products match your search' : 'No products yet'}
                  </h3>
                  <p style={{ marginBottom:20 }}>
                    {search || category
                      ? 'Try clearing your filters to see all products.'
                      : 'This shop hasn\'t listed any products yet. Check back soon!'}
                  </p>
                  {(search || category) && (
                    <button className="btn btn-outline" onClick={() => { setSearch(''); setCategory(''); }}>
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Active filters */}
                  {(search || category) && (
                    <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
                      <span style={{ fontSize:13, color:'var(--text-light)' }}>Showing {total} result{total !== 1 ? 's' : ''} for</span>
                      {search   && <span className="shop-filter-chip">{search} <button onClick={() => setSearch('')}>×</button></span>}
                      {category && <span className="shop-filter-chip">{category} <button onClick={() => setCategory('')}>×</button></span>}
                    </div>
                  )}

                  <div className="shop-products-grid">
                    {products.map((p, i) => (
                      <ProductCard key={p._id} p={p} vendorId={vendor._id} idx={i} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pages > 1 && (
                    <div style={{ display:'flex', justifyContent:'center', gap:8, marginTop:40 }}>
                      <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => fetchProducts(page - 1)}>← Prev</button>
                      {Array.from({ length: pages }, (_, i) => i + 1).map(pg => (
                        <button
                          key={pg}
                          className={`btn btn-sm ${pg === page ? 'btn-primary' : 'btn-outline'}`}
                          onClick={() => fetchProducts(pg)}
                        >{pg}</button>
                      ))}
                      <button className="btn btn-outline btn-sm" disabled={page === pages} onClick={() => fetchProducts(page + 1)}>Next →</button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ABOUT TAB */}
          {activeTab === 'about' && (
            <div className="shop-about-grid">
              {/* Shop Info */}
              <div className="content-card">
                <h2 style={{ fontSize:18, fontWeight:700, marginBottom:20, color:'var(--dark)', display:'flex', alignItems:'center', gap:8 }}>
                  🏪 About {vendor.shopName}
                </h2>
                {vendor.description ? (
                  <p style={{ fontSize:15, lineHeight:1.7, color:'var(--text)', marginBottom:20 }}>{vendor.description}</p>
                ) : (
                  <p style={{ color:'var(--text-light)', marginBottom:20 }}>No description provided.</p>
                )}

                <div className="shop-about-details">
                  <div className="shop-about-row">
                    <span className="shop-about-icon">👤</span>
                    <div><strong>Owner</strong><span>{vendor.ownerName}</span></div>
                  </div>
                  {vendor.city && (
                    <div className="shop-about-row">
                      <span className="shop-about-icon">📍</span>
                      <div><strong>Location</strong><span>{vendor.city}{vendor.address ? `, ${vendor.address}` : ''}</span></div>
                    </div>
                  )}
                  {since && (
                    <div className="shop-about-row">
                      <span className="shop-about-icon">📅</span>
                      <div><strong>On ServeHub since</strong><span>{since}</span></div>
                    </div>
                  )}
                  {vendor.categories.length > 0 && (
                    <div className="shop-about-row">
                      <span className="shop-about-icon">🏷️</span>
                      <div>
                        <strong>Categories</strong>
                        <span style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
                          {vendor.categories.map(c => (
                            <span key={c} style={{ background:'#dcfce7', color:'#15803d', padding:'2px 10px', borderRadius:20, fontSize:12, fontWeight:600 }}>{c}</span>
                          ))}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact */}
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div className="content-card shop-contact-card">
                  <h3 style={{ fontSize:16, fontWeight:700, marginBottom:16, color:'var(--dark)' }}>📞 Contact the Shop</h3>
                  <p style={{ fontSize:13, color:'var(--text-light)', marginBottom:16, lineHeight:1.5 }}>
                    To get the vendor's contact details, open any product from this shop and click "Contact".
                  </p>
                  <button className="btn btn-primary btn-full" onClick={() => setActiveTab('products')}>
                    🛒 Browse Products
                  </button>
                </div>

                {/* Stats card */}
                <div className="content-card">
                  <h3 style={{ fontSize:14, fontWeight:700, marginBottom:16, color:'var(--dark)' }}>Shop Stats</h3>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    {[
                      { icon:'📦', label:'Products', val: total },
                      { icon:'⭐', label:'Rating',   val: vendor.rating > 0 ? vendor.rating.toFixed(1) : '—' },
                      { icon:'💬', label:'Reviews',  val: vendor.reviewCount },
                      { icon:'✅', label:'Status',   val: vendor.isActive ? 'Active' : 'Inactive' },
                    ].map(s => (
                      <div key={s.label} style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px', textAlign:'center' }}>
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
