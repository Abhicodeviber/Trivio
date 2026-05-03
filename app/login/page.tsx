'use client';
import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface FieldErrors { email?: string; password?: string; }

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPwd, setShowPwd]     = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading]     = useState(false);

  const validate = (): boolean => {
    const errs: FieldErrors = {};
    if (!email.trim())             errs.email    = 'Email is required.';
    else if (!isValidEmail(email)) errs.email    = 'Enter a valid email address.';
    if (!password)                 errs.password = 'Password is required.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await login(email.trim().toLowerCase(), password);
      if (user.role === 'admin')         router.push('/dashboard/admin');
      else if (user.role === 'provider') router.push('/dashboard/provider');
      else if (user.role === 'vendor')   router.push('/dashboard/vendor');
      else                               router.push('/dashboard/customer');
    } catch (err: unknown) {
      setServerError((err as Error).message ?? 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-visual">
        <div className="auth-visual-bg" />
        <div className="auth-illustration">
          <div className="nav-logo" style={{ marginBottom: 48 }}>
            <div className="logo-icon lg">S</div>
            <span className="logo-text lg" style={{ color: 'white' }}>ServeHub</span>
          </div>
          <h2>Welcome back</h2>
          <p>Sign in to access your dashboard and manage services.</p>
          <div className="auth-features">
            {['Manage your services', 'Connect with clients', 'Track your earnings'].map((f) => (
              <div key={f} className="af-item"><span className="af-item-dot">✓</span>{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-form-wrap">
        <div className="auth-form-card">
          <h2>Sign In</h2>
          <p className="auth-sub">
            Don&apos;t have an account? <Link href="/signup">Sign up free</Link>
          </p>

          {serverError && (
            <div className="form-alert form-alert-error">⚠ {serverError}</div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className={`form-input${fieldErrors.email ? ' input-error' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: undefined })); }}
                autoComplete="email"
                disabled={loading}
              />
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </div>

            {/* Password */}
            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  className={`form-input${fieldErrors.password ? ' input-error' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: undefined })); }}
                  autoComplete="current-password"
                  disabled={loading}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#6b7280' }}
                >
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
              {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
              <a href="#" className="form-link" style={{ marginTop: 6 }}>Forgot password?</a>
            </div>

            {/* Remember me */}
            <div className="form-check">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember me for 30 days</label>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
              style={{ opacity: loading ? 0.75 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>

          <div className="divider"><span>or continue with</span></div>
          <div className="social-auth">
            <button className="social-btn"><span className="social-btn-icon">G</span> Google</button>
            <button className="social-btn"><span className="social-btn-icon">f</span> Facebook</button>
          </div>
        </div>
      </div>
    </div>
  );
}
