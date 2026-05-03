'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Vendor { _id: string; shopName: string; city: string; logo?: string; rating: number; }
interface Product {
  _id: string; title: string; description: string; category: string;
  price: number; unit: string; images: string[]; tags: string[];
  inStock: boolean; vendor: Vendor;
}

const PRODUCT_CATEGORIES = [
  'Vegetables', 'Fruits', 'Dairy & Eggs', 'Meat & Fish',
  'Bakery', 'Beverages', 'Snacks', 'Electronics',
  'Clothing', 'Home & Kitchen', 'Beauty & Health', 'Books',
  'Toys', 'Sports', 'Stationery', 'Other',
];

const GRADIENTS = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#fccb90,#d57eeb)',
  'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
];

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts]   = useState<Product[]>([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const search   = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? '';
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const inStock  = searchParams.get('inStock')  ?? '';
  const sort     = searchParams.get('sort')     ?? 'createdAt';
  const page     = parseInt(searchParams.get('page') ?? '1');

  const [searchInput, setSearchInput]   = useState(search);
  const [maxPriceInput, setMaxPriceInput] = useState(maxPrice);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const pushParams = useCallback((updates: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) p.set(k, v); else p.delete(k);
    }
    p.delete('page');
    router.push(`/products?${p.toString()}`);
  }, [router, searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search)   params.set('search',   search);
    if (category) params.set('category', category);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (inStock)  params.set('inStock',  inStock);
    params.set('sort',  sort);
    params.set('page',  String(page));
    params.set('limit', '12');

    setLoading(true);
    setError('');
    fetch(`/api/products?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        setProducts(data.products ?? []);
        setTotal(data.total ?? 0);
        setPages(data.pages ?? 1);
      })
      .catch(() => setError('Could not load products. Please try again.'))
      .finally(() => setLoading(false));
  }, [search, category, minPrice, maxPrice, inStock, sort, page]);

  function handleSearchChange(val: string) {
    setSearchInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushParams({ search: val }), 350);
  }

  function handleMaxPrice(val: string) {
    setMaxPriceInput(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushParams({ maxPrice: val }), 500);
  }

  const activeFilters = [
    search   && { key: 'search',   label: `"${search}"` },
    category && { key: 'category', label: category },
    maxPrice && { key: 'maxPrice', label: `≤ ₹${maxPrice}` },
    inStock === 'true' && { key: 'inStock', label: 'In Stock' },
  ].filter(Boolean) as { key: string; label: string }[];

  function clearAll() { router.push('/products'); setSearchInput(''); setMaxPriceInput(''); }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#14532d,#166534)', padding: '40px 0 24px', color: '#fff' }}>
        <div className="container">
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 6px' }}>🛍️ Shop Products</h1>
          <p style={{ opacity: 0.85, margin: 0 }}>Find products from local vendors near you</p>
        </div>
      </div>

      <div className="container" style={{ padding: '24px 16px' }}>
        {/* Search bar */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: 'var(--shadow)', marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text" className="form-input" placeholder="🔍 Search products…"
            value={searchInput} onChange={e => handleSearchChange(e.target.value)}
            style={{ flex: '1 1 200px', margin: 0 }}
          />
          <select className="form-input" value={category} onChange={e => pushParams({ category: e.target.value })}
            style={{ flex: '0 0 180px', margin: 0 }}>
            <option value="">All Categories</option>
            {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input
            type="number" className="form-input" placeholder="Max price (₹)"
            value={maxPriceInput} onChange={e => handleMaxPrice(e.target.value)}
            style={{ flex: '0 0 140px', margin: 0 }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={inStock === 'true'}
              onChange={e => pushParams({ inStock: e.target.checked ? 'true' : '' })} />
            In Stock Only
          </label>
          <select className="form-input" value={sort} onChange={e => pushParams({ sort: e.target.value })}
            style={{ flex: '0 0 150px', margin: 0 }}>
            <option value="createdAt">Newest First</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
        </div>

        {/* Active filter chips */}
        {activeFilters.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-light)' }}>Filters:</span>
            {activeFilters.map(f => (
              <span key={f.key} className="ptag" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={() => { pushParams({ [f.key]: '' }); if (f.key === 'search') setSearchInput(''); if (f.key === 'maxPrice') setMaxPriceInput(''); }}>
                {f.label} ×
              </span>
            ))}
            <button onClick={clearAll} style={{ fontSize: 12, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Clear all
            </button>
          </div>
        )}

        {/* Results count */}
        {!loading && (
          <p style={{ fontSize: 13, color: 'var(--text-light)', marginBottom: 16 }}>
            {total === 0 ? 'No products found' : `${total} product${total !== 1 ? 's' : ''} found`}
          </p>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', color: '#dc2626', marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="service-grid">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="service-card" style={{ animation: 'pulse 1.5s infinite' }}>
                <div style={{ height: 80, background: '#e2e8f0', borderRadius: '8px 8px 0 0' }} />
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ height: 14, background: '#e2e8f0', borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ height: 12, background: '#f1f5f9', borderRadius: 4, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Product grid */}
        {!loading && products.length > 0 && (
          <div className="service-grid">
            {products.map((p, i) => (
              <Link key={p._id} href={`/products/${p._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="service-card" style={{ animation: `fadeInUp 0.4s ease both`, animationDelay: `${i * 0.05}s`, cursor: 'pointer' }}>
                  <div className="sc-cover" style={{ background: GRADIENTS[i % GRADIENTS.length] }}>
                    {p.images[0]
                      ? <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 32 }}>🛍️</span>}
                    {!p.inStock && (
                      <span style={{ position: 'absolute', top: 8, right: 8, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                        Out of Stock
                      </span>
                    )}
                  </div>
                  <div className="sc-body">
                    <div className="sc-provider" style={{ marginBottom: 6 }}>
                      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#14532d,#166534)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                        {p.vendor?.shopName?.slice(0, 2).toUpperCase() ?? 'VD'}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-light)', marginLeft: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.vendor?.shopName ?? 'Unknown Shop'}
                      </span>
                      {p.vendor?.city && <span style={{ fontSize: 11, color: 'var(--text-light)', marginLeft: 'auto', flexShrink: 0 }}>📍 {p.vendor.city}</span>}
                    </div>
                    <div className="sc-title">{p.title}</div>
                    {p.category && <span className="ptag" style={{ fontSize: 11, marginBottom: 6, display: 'inline-block' }}>{p.category}</span>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 'auto', flexWrap: 'wrap' }}>
                      {p.tags?.slice(0, 2).map(t => (
                        <span key={t} className="ptag" style={{ fontSize: 11, background: '#f1f5f9', color: 'var(--text-light)', border: 'none' }}>{t}</span>
                      ))}
                    </div>
                    <div className="sc-footer" style={{ marginTop: 10 }}>
                      <div>
                        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--primary)' }}>₹{p.price}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-light)', marginLeft: 4 }}>/ {p.unit}</span>
                      </div>
                      <button className="btn btn-primary btn-sm">View</button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && products.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🛒</div>
            <h3 style={{ color: 'var(--dark)', marginBottom: 8 }}>No products found</h3>
            <p style={{ color: 'var(--text-light)', marginBottom: 20 }}>Try adjusting your filters or search term.</p>
            <button className="btn btn-primary" onClick={clearAll}>Clear Filters</button>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="pagination" style={{ marginTop: 32 }}>
            <button className="page-btn" disabled={page <= 1}
              onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.set('page', String(page - 1)); router.push(`/products?${p.toString()}`); }}>
              ← Prev
            </button>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
              const pg = pages <= 7 ? i + 1 : i === 0 ? 1 : i === 6 ? pages : page - 2 + i;
              return (
                <button key={pg} className={`page-btn${page === pg ? ' active' : ''}`}
                  onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.set('page', String(pg)); router.push(`/products?${p.toString()}`); }}>
                  {pg}
                </button>
              );
            })}
            <button className="page-btn" disabled={page >= pages}
              onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.set('page', String(page + 1)); router.push(`/products?${p.toString()}`); }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
