'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

const COVERS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#ffecd2,#fcb69f)',
  'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
];
const COLORS = ['#6366f1','#ec4899','#0ea5e9','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4'];

interface Category { _id: string; name: string; icon: string; }
interface Service {
  _id: string; title: string; description: string;
  price: number; priceType: string; rating: number; reviewCount: number;
  tags: string[]; isActive: boolean;
  category: { _id: string; name: string; icon: string };
  provider: { _id: string; name: string; location?: string };
}

const LIMIT = 12;

function ServiceCard({ svc, idx }: { svc: Service; idx: number }) {
  const initials = svc.provider?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) ?? 'PR';
  const priceLabel = svc.priceType === 'hourly' ? '/hr' : svc.priceType === 'daily' ? '/day' : '';
  return (
    <Link href={`/services/${svc._id}`} style={{ textDecoration: 'none' }}>
      <div className="service-card" style={{ animation: `fadeInUp 0.35s ease both`, animationDelay: `${(idx % LIMIT) * 0.05}s` }}>
        <div className="sc-cover" style={{ background: COVERS[idx % COVERS.length], position: 'relative' }}>
          <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 28, opacity: 0.7 }}>
            {svc.category?.icon}
          </span>
        </div>
        <div className="sc-body">
          <div className="sc-provider">
            <div className="sc-avatar" style={{ background: COLORS[idx % COLORS.length] }}>{initials}</div>
            <div><strong>{svc.provider?.name}</strong><span>{svc.category?.name}</span></div>
          </div>
          <h3 className="sc-title">{svc.title}</h3>
          <div className="sc-rating">
            ⭐ {svc.rating > 0 ? svc.rating.toFixed(1) : 'New'}
            <span className="sc-reviews">({svc.reviewCount} reviews)</span>
          </div>
          <div className="sc-tags">{(svc.tags ?? []).slice(0,3).map(t => <span key={t} className="ptag">{t}</span>)}</div>
          <div className="sc-footer">
            <span className="sc-price">From <strong>${svc.price}</strong>{priceLabel}</span>
            <button className="btn btn-sm btn-primary">View →</button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function BrowsePage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // ── Read initial state from URL ──
  const [q,         setQ]         = useState(searchParams.get('q') ?? '');
  const [catId,     setCatId]     = useState(searchParams.get('category') ?? '');
  const [maxPrice,  setMaxPrice]  = useState(Number(searchParams.get('maxPrice') ?? 500));
  const [minRating, setMinRating] = useState(searchParams.get('minRating') ?? '');
  const [sort,      setSort]      = useState(searchParams.get('sort') ?? 'createdAt');
  const [page,      setPage]      = useState(Number(searchParams.get('page') ?? 1));
  const [view,      setView]      = useState<'grid'|'list'>('grid');

  const [categories, setCategories] = useState<Category[]>([]);
  const [services,   setServices]   = useState<Service[]>([]);
  const [total,      setTotal]      = useState(0);
  const [pages,      setPages]      = useState(1);
  const [loading,    setLoading]    = useState(true);

  const inputRef = useRef<HTMLInputElement>(null);

  // ── Fetch categories once ──
  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(d => setCategories(d.categories ?? []));
  }, []);

  // ── Build query string and push to URL ──
  const buildQS = useCallback((overrides: Record<string, string|number> = {}) => {
    const p: Record<string, string> = {};
    if (q)        p.q         = q;
    if (catId)    p.category  = catId;
    if (maxPrice < 500) p.maxPrice = String(maxPrice);
    if (minRating)  p.minRating = minRating;
    if (sort !== 'createdAt') p.sort = sort;
    if (page > 1) p.page = String(page);
    Object.assign(p, Object.fromEntries(Object.entries(overrides).map(([k,v]) => [k, String(v)])));
    // remove empties
    Object.keys(p).forEach(k => { if (!p[k]) delete p[k]; });
    return new URLSearchParams(p).toString();
  }, [q, catId, maxPrice, minRating, sort, page]);

  // ── Fetch services ──
  const fetchServices = useCallback(async (overrides: Record<string,string|number> = {}) => {
    setLoading(true);
    const qs = buildQS(overrides);
    try {
      const res  = await fetch(`/api/services?${qs}&limit=${LIMIT}`);
      const data = await res.json();
      setServices(data.services ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [buildQS]);

  useEffect(() => { fetchServices(); }, []); // initial load

  // ── Apply filters (also updates URL) ──
  const applyFilters = (overrides: Record<string,string|number> = {}) => {
    const newPage = overrides.page ? Number(overrides.page) : 1;
    setPage(newPage);
    const qs = buildQS({ ...overrides, page: newPage });
    router.push(`/browse?${qs}`, { scroll: false });
    fetchServices({ ...overrides, page: newPage });
  };

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); applyFilters(); };

  const toggleCat = (id: string) => {
    const next = catId === id ? '' : id;
    setCatId(next);
    applyFilters({ category: next });
  };

  const handleSort = (val: string) => { setSort(val); applyFilters({ sort: val }); };
  const handlePage = (p: number)   => { setPage(p);   applyFilters({ page: p }); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const clearAll = () => {
    setQ(''); setCatId(''); setMaxPrice(500); setMinRating(''); setSort('createdAt'); setPage(1);
    if (inputRef.current) inputRef.current.value = '';
    router.push('/browse', { scroll: false });
    fetchServices({ q:'', category:'', maxPrice:'', minRating:'', sort:'createdAt', page:1 });
  };

  const totalPages = pages;

  return (
    <>
      <Navbar />

      {/* Header */}
      <div className="page-header-bar">
        <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <h2>Browse Services</h2>
            <p>Discover skilled professionals for every need</p>
          </div>
          <form onSubmit={handleSearch} style={{ display:'flex', gap:8 }}>
            <div style={{ position:'relative' }}>
              <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:16 }}>🔍</span>
              <input
                ref={inputRef}
                type="text"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search services…"
                className="form-input"
                style={{ paddingLeft:36, width:260, height:40 }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ height:40 }}>Search</button>
          </form>
        </div>
      </div>

      <div className="container browse-layout" style={{ padding:'28px 24px', gap:24 }}>

        {/* ── Sidebar ── */}
        <aside className="filter-sidebar">

          {/* Categories */}
          <div className="filter-section">
            <h4>Category</h4>
            <label className="filter-check" style={{ marginBottom:6 }}>
              <input type="radio" name="cat" checked={catId === ''} onChange={() => toggleCat('')} />
              &nbsp;All Categories
            </label>
            {categories.map(c => (
              <label key={c._id} className="filter-check" style={{ marginBottom:6 }}>
                <input type="radio" name="cat" checked={catId === c._id} onChange={() => toggleCat(c._id)} />
                &nbsp;{c.icon} {c.name}
              </label>
            ))}
          </div>

          {/* Price */}
          <div className="filter-section">
            <h4>Max Price</h4>
            <input
              type="range" min="10" max="500" step="10"
              value={maxPrice}
              onChange={e => setMaxPrice(Number(e.target.value))}
              onMouseUp={() => applyFilters({ maxPrice })}
              onTouchEnd={() => applyFilters({ maxPrice })}
              className="range-slider"
            />
            <div className="price-labels"><span>$10</span><span style={{ fontWeight:700, color:'var(--primary)' }}>${maxPrice}</span><span>$500</span></div>
          </div>

          {/* Rating */}
          <div className="filter-section">
            <h4>Min Rating</h4>
            {[['','Any Rating'],['4.5','⭐ 4.5+'],['4','⭐ 4.0+'],['3','⭐ 3.0+']].map(([val, label]) => (
              <label key={label} className="filter-check" style={{ marginBottom:6 }}>
                <input
                  type="radio" name="rating"
                  checked={minRating === val}
                  onChange={() => { setMinRating(val); applyFilters({ minRating: val }); }}
                />
                &nbsp;{label}
              </label>
            ))}
          </div>

          {/* Sort (mobile) */}
          <div className="filter-section">
            <h4>Sort By</h4>
            <select className="form-input" value={sort} onChange={e => handleSort(e.target.value)} style={{ width:'100%' }}>
              <option value="createdAt">Newest</option>
              <option value="rating">Top Rated</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>
          </div>

          <button className="btn btn-ghost" style={{ width:'100%', marginTop:4 }} onClick={clearAll}>✕ Clear Filters</button>
        </aside>

        {/* ── Results ── */}
        <div>
          {/* Results bar */}
          <div className="results-header" style={{ marginBottom:20 }}>
            <span className="results-count">
              {loading ? 'Loading…' : `${total} service${total !== 1 ? 's' : ''} found`}
              {catId && categories.find(c => c._id === catId) && (
                <span style={{ marginLeft:8, fontSize:13, color:'var(--primary)', fontWeight:600 }}>
                  in {categories.find(c => c._id === catId)!.icon} {categories.find(c => c._id === catId)!.name}
                </span>
              )}
            </span>
            <div className="sort-bar">
              <span style={{ fontSize:13, color:'var(--text-light)' }}>Sort:</span>
              <select className="sort-select" value={sort} onChange={e => handleSort(e.target.value)}>
                <option value="createdAt">Newest</option>
                <option value="rating">Top Rated</option>
                <option value="price_asc">Price ↑</option>
                <option value="price_desc">Price ↓</option>
              </select>
              <div className="view-toggle">
                <button className={`view-btn${view==='grid'?' active':''}`} onClick={() => setView('grid')}>▦</button>
                <button className={`view-btn${view==='list'?' active':''}`} onClick={() => setView('list')}>☰</button>
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {(q || catId || maxPrice < 500 || minRating) && (
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
              {q && <span className="ptag" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>🔍 "{q}" <button onClick={() => { setQ(''); applyFilters({ q:'' }); }} style={{ background:'none', border:'none', cursor:'pointer', marginLeft:4, color:'var(--primary)', fontWeight:700 }}>×</button></span>}
              {catId && categories.find(c=>c._id===catId) && <span className="ptag" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>{categories.find(c=>c._id===catId)!.icon} {categories.find(c=>c._id===catId)!.name} <button onClick={() => { setCatId(''); applyFilters({ category:'' }); }} style={{ background:'none', border:'none', cursor:'pointer', marginLeft:4, color:'var(--primary)', fontWeight:700 }}>×</button></span>}
              {maxPrice < 500 && <span className="ptag" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>Max ${maxPrice} <button onClick={() => { setMaxPrice(500); applyFilters({ maxPrice:500 }); }} style={{ background:'none', border:'none', cursor:'pointer', marginLeft:4, color:'var(--primary)', fontWeight:700 }}>×</button></span>}
              {minRating && <span className="ptag" style={{ background:'var(--primary-light)', color:'var(--primary)' }}>⭐ {minRating}+ <button onClick={() => { setMinRating(''); applyFilters({ minRating:'' }); }} style={{ background:'none', border:'none', cursor:'pointer', marginLeft:4, color:'var(--primary)', fontWeight:700 }}>×</button></span>}
            </div>
          )}

          {/* Grid / List */}
          {loading ? (
            <div className={view === 'grid' ? 'service-grid' : ''} style={view==='list' ? { display:'flex', flexDirection:'column', gap:12 } : {}}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="service-card" style={{ opacity:0.4 }}>
                  <div className="sc-cover" style={{ background:'#e2e8f0' }} />
                  <div className="sc-body">
                    <div style={{ height:14, background:'#e2e8f0', borderRadius:4, marginBottom:8, width:'60%' }} />
                    <div style={{ height:12, background:'#f1f5f9', borderRadius:4, width:'80%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : services.length === 0 ? (
            <div className="content-card" style={{ textAlign:'center', padding:'60px 24px' }}>
              <div style={{ fontSize:52, marginBottom:12 }}>🔍</div>
              <h3 style={{ marginBottom:8 }}>No services found</h3>
              <p style={{ color:'var(--text-light)', marginBottom:20 }}>Try adjusting your filters or search term.</p>
              <button className="btn btn-primary" onClick={clearAll}>Clear Filters</button>
            </div>
          ) : view === 'grid' ? (
            <div className="service-grid">
              {services.map((svc, i) => <ServiceCard key={svc._id} svc={svc} idx={i} />)}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {services.map((svc, i) => {
                const initials = svc.provider?.name?.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) ?? 'PR';
                const priceLabel = svc.priceType==='hourly' ? '/hr' : svc.priceType==='daily' ? '/day' : '';
                return (
                  <Link key={svc._id} href={`/services/${svc._id}`} style={{ textDecoration:'none' }}>
                    <div className="content-card" style={{ display:'flex', gap:16, alignItems:'center', padding:'16px 20px', animation:`fadeInUp 0.3s ease both`, animationDelay:`${i*0.04}s` }}>
                      <div style={{ width:56, height:56, borderRadius:12, background:COVERS[i%COVERS.length], display:'grid', placeItems:'center', fontSize:24, flexShrink:0 }}>
                        {svc.category?.icon}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                          <div style={{ width:28, height:28, borderRadius:'50%', background:COLORS[i%COLORS.length], display:'grid', placeItems:'center', color:'white', fontWeight:700, fontSize:11 }}>{initials}</div>
                          <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{svc.provider?.name}</span>
                          {svc.provider?.location && <span style={{ fontSize:12, color:'var(--text-light)' }}>📍 {svc.provider.location}</span>}
                        </div>
                        <h3 style={{ fontSize:15, fontWeight:700, marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{svc.title}</h3>
                        <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
                          <span style={{ fontSize:13, color:'var(--text-light)' }}>⭐ {svc.rating > 0 ? svc.rating.toFixed(1) : 'New'} ({svc.reviewCount})</span>
                          {(svc.tags??[]).slice(0,2).map(t=><span key={t} className="ptag" style={{ fontSize:12 }}>{t}</span>)}
                        </div>
                      </div>
                      <div style={{ textAlign:'right', flexShrink:0 }}>
                        <div style={{ fontSize:18, fontWeight:800, color:'var(--primary)' }}>${svc.price}<span style={{ fontSize:12, fontWeight:400, color:'var(--text-light)' }}>{priceLabel}</span></div>
                        <button className="btn btn-sm btn-primary" style={{ marginTop:6 }}>View →</button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination" style={{ marginTop:28 }}>
              <button className="page-btn" onClick={() => handlePage(page-1)} disabled={page<=1} style={{ opacity:page<=1?0.4:1 }}>← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i+1)
                .filter(p => p===1 || p===totalPages || Math.abs(p-page)<=1)
                .reduce<(number|'…')[]>((acc, p, i, arr) => {
                  if (i > 0 && (arr[i-1] as number) < p - 1) acc.push('…');
                  acc.push(p); return acc;
                }, [])
                .map((p, i) =>
                  p === '…'
                    ? <span key={`e${i}`} className="page-btn" style={{ cursor:'default' }}>…</span>
                    : <button key={p} className={`page-btn${page===p?' active':''}`} onClick={() => handlePage(p as number)}>{p}</button>
                )
              }
              <button className="page-btn" onClick={() => handlePage(page+1)} disabled={page>=totalPages} style={{ opacity:page>=totalPages?0.4:1 }}>Next →</button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
