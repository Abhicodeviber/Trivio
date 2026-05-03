'use client';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [dropOpen,  setDropOpen]  = useState(false);
  const { user, logout }          = useAuth();
  const dropRef                   = useRef<HTMLDivElement>(null);
  const pathname                  = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
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

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const dashboardHref =
    user?.role === 'admin'    ? '/dashboard/admin'    :
    user?.role === 'provider' ? '/dashboard/provider' :
    user?.role === 'vendor'   ? '/dashboard/vendor'   :
    '/dashboard/customer';

  const u = user as unknown as Record<string, string> | null;
  const displayName = u?.shopName ?? user?.name ?? '';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const navLinks = [
    { href: '/',         label: 'Home' },
    { href: '/browse',   label: 'Services' },
    { href: '/products', label: 'Products' },
    ...(user ? [{ href: dashboardHref, label: 'Dashboard' }] : []),
  ];

  return (
    <nav className={`navbar${scrolled ? ' navbar-scrolled' : ''}`}>
      <div className="nav-container">

        {/* Logo */}
        <Link href="/" className="nav-logo" style={{ textDecoration: 'none' }}>
          <div className="logo-icon">S</div>
          <span className="logo-text">ServeHub</span>
        </Link>

        {/* Desktop links */}
        <div className="nav-links">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href}
              className={`nav-link${pathname === l.href ? ' nav-link-active' : ''}`}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="nav-actions">
          {user ? (
            <div ref={dropRef} style={{ position: 'relative' }}>
              <button className="nav-user-btn" onClick={() => setDropOpen(p => !p)}>
                <div className="nav-user-av" style={{
                  background: user.role === 'vendor'
                    ? 'linear-gradient(135deg,#16a34a,#4ade80)'
                    : 'linear-gradient(135deg,#6366f1,#818cf8)',
                }}>
                  {initials}
                </div>
                <span className="nav-user-name">{displayName.split(' ')[0]}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: .6, transition: 'transform .2s', transform: dropOpen ? 'rotate(180deg)' : 'none' }}>
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {dropOpen && (
                <div className="nav-drop">
                  <div className="nav-drop-head">
                    <div className="nav-drop-av" style={{
                      background: user.role === 'vendor'
                        ? 'linear-gradient(135deg,#16a34a,#4ade80)'
                        : 'linear-gradient(135deg,#6366f1,#818cf8)',
                    }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{displayName}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 1 }}>{user.email}</div>
                      <div style={{ marginTop: 4, fontSize: 11, fontWeight: 600, display: 'inline-block', padding: '2px 8px', borderRadius: 10,
                        background: user.role === 'vendor' ? 'rgba(74,222,128,.15)' : 'rgba(129,140,248,.15)',
                        color:      user.role === 'vendor' ? '#4ade80' : '#818cf8' }}>
                        {user.role === 'vendor' ? '🏪 Vendor' : user.role}
                      </div>
                    </div>
                  </div>
                  <div className="nav-drop-body">
                    <Link href={dashboardHref} className="nav-drop-item" onClick={() => setDropOpen(false)}>
                      <span>📊</span> Dashboard
                    </Link>
                    <button className="nav-drop-item nav-drop-logout" onClick={() => { logout(); setDropOpen(false); }}>
                      <span>↩</span> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="nav-btn-ghost">Log In</Link>
              <Link href="/signup" className="nav-btn-primary">Get Started</Link>
            </>
          )}

          {/* Hamburger */}
          <button className={`hamburger${menuOpen ? ' open' : ''}`} onClick={() => setMenuOpen(p => !p)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="nav-mobile">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href}
              className={`nav-mobile-link${pathname === l.href ? ' active' : ''}`}
              onClick={() => setMenuOpen(false)}>
              {l.label}
            </Link>
          ))}
          {!user && (
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <Link href="/login" className="nav-btn-ghost" style={{ flex: 1, textAlign: 'center' }}>Log In</Link>
              <Link href="/signup" className="nav-btn-primary" style={{ flex: 1, textAlign: 'center' }}>Get Started</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
