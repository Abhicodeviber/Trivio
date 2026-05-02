'use client';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [dropOpen, setDropOpen]   = useState(false);
  const { user, logout }          = useAuth();
  const dropRef                   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const dashboardHref =
    user?.role === 'admin'    ? '/dashboard/admin'    :
    user?.role === 'provider' ? '/dashboard/provider' :
    user?.role === 'vendor'   ? '/dashboard/vendor'   :
    '/dashboard/customer';

  const u = user as unknown as Record<string, string> | null;
  const displayName = u?.shopName ?? user?.name ?? '';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const mobileMenuStyle = menuOpen
    ? { display: 'flex', flexDirection: 'column' as const, position: 'absolute' as const, top: 64, left: 0, right: 0, background: 'white', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,.08)', zIndex: 99 }
    : {};

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="nav-container">
        <Link href="/" className="nav-logo" style={{ textDecoration: 'none' }}>
          <div className="logo-icon">S</div>
          <span className="logo-text">ServeHub</span>
        </Link>

        <div className="nav-links" style={mobileMenuStyle}>
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/browse" className="nav-link">Services</Link>
          <Link href="/products" className="nav-link">Products</Link>
          {user && <Link href={dashboardHref} className="nav-link">Dashboard</Link>}
        </div>

        <div className="nav-actions">
          {user ? (
            <div ref={dropRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setDropOpen(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: '1.5px solid var(--border)', borderRadius: 24, padding: '5px 12px 5px 6px', cursor: 'pointer', transition: 'all .2s' }}
              >
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: user.role === 'vendor' ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,var(--primary),var(--secondary))', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                  {initials}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName.split(' ')[0]}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-light)', marginLeft: -2 }}>▾</span>
              </button>

              {dropOpen && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'white', border: '1.5px solid var(--border)', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,.1)', minWidth: 190, overflow: 'hidden', zIndex: 200, animation: 'fadeInUp .15s ease' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--dark)' }}>{displayName}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-light)' }}>{user.email}</div>
                    <div style={{ fontSize: 11, marginTop: 2, background: user.role === 'vendor' ? '#dcfce7' : 'var(--primary-light,#ede9fe)', color: user.role === 'vendor' ? '#166534' : 'var(--primary)', display: 'inline-block', padding: '1px 8px', borderRadius: 10, fontWeight: 600, textTransform: 'capitalize' }}>
                      {user.role === 'vendor' ? '🏪 Vendor' : user.role}
                    </div>
                  </div>
                  <Link href={dashboardHref} onClick={() => setDropOpen(false)}
                    style={{ display: 'block', padding: '10px 16px', fontSize: 14, color: 'var(--text)', textDecoration: 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    📊 Dashboard
                  </Link>
                  <button onClick={() => { logout(); setDropOpen(false); }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', fontSize: 14, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', borderTop: '1px solid var(--border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    ↩ Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login"><button className="btn btn-ghost">Log In</button></Link>
              <Link href="/signup"><button className="btn btn-primary">Get Started</button></Link>
            </>
          )}

          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  );
}
