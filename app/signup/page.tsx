'use client';
import Link from 'next/link';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

type Role = 'customer' | 'provider' | 'vendor';

interface FieldErrors {
  firstName?: string; email?: string; phone?: string; location?: string;
  password?: string; confirmPassword?: string; agreed?: string;
  shopName?: string; ownerName?: string;
}

function isValidEmail(v: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

const ROLE_CONFIG = {
  customer: {
    icon: '👤', label: 'I need services',
    heading: 'Find Great Services',
    desc: 'Connect with verified local professionals in minutes.',
    features: ['Browse 10,000+ services', 'Book in one click', 'Secure payments'],
  },
  provider: {
    icon: '🛠️', label: 'I offer services',
    heading: 'Offer Your Services',
    desc: 'Join thousands of professionals earning on their own schedule.',
    features: ['Free to join', 'Get verified in 24hrs', 'Start earning immediately'],
  },
  vendor: {
    icon: '🏪', label: 'I sell products',
    heading: 'Open Your Shop',
    desc: 'List your products and connect with thousands of buyers.',
    features: ['Free shop setup', 'Easy product management', 'Direct customer contact'],
  },
};

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();

  const [role, setRole]             = useState<Role>('customer');
  const [firstName, setFirstName]   = useState('');
  const [lastName, setLastName]     = useState('');
  const [email, setEmail]           = useState('');
  const [phone, setPhone]           = useState('');
  const [whatsapp, setWhatsapp]     = useState('');
  const [location, setLocation]     = useState('');
  const [skills, setSkills]         = useState('');
  const [shopName, setShopName]     = useState('');
  const [ownerName, setOwnerName]   = useState('');
  const [city, setCity]             = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword]     = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd]       = useState(false);
  const [agreed, setAgreed]         = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading]       = useState(false);

  const clearErr = (key: keyof FieldErrors) => setFieldErrors(p => ({ ...p, [key]: undefined }));

  const validate = (): boolean => {
    const errs: FieldErrors = {};
    if (role !== 'vendor') {
      if (!firstName.trim()) errs.firstName = 'First name is required.';
    }
    if (role === 'vendor') {
      if (!shopName.trim())  errs.shopName  = 'Shop name is required.';
      if (!ownerName.trim()) errs.ownerName = 'Owner name is required.';
    }
    if (!email.trim())           errs.email    = 'Email is required.';
    else if (!isValidEmail(email)) errs.email  = 'Enter a valid email address.';
    if ((role === 'provider' || role === 'vendor') && !phone.trim()) errs.phone = 'Phone number is required.';
    if (role === 'provider' && !location.trim()) errs.location = 'Location is required.';
    if (!password)               errs.password = 'Password is required.';
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (!confirmPwd)             errs.confirmPassword = 'Please confirm your password.';
    else if (password !== confirmPwd) errs.confirmPassword = 'Passwords do not match.';
    if (!agreed)                 errs.agreed = 'You must accept the Terms to continue.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setLoading(true);
    try {
      let user;
      if (role === 'vendor') {
        user = await signup('', email.trim().toLowerCase(), password, 'vendor', {
          shopName: shopName.trim(),
          ownerName: ownerName.trim(),
          phone: phone.trim(),
          whatsapp: whatsapp.trim(),
          city: city.trim(),
          description: description.trim(),
        });
      } else {
        const name = `${firstName.trim()} ${lastName.trim()}`.trim();
        const extra = role === 'provider'
          ? { phone: phone.trim(), location: location.trim(), skills: skills.split(',').map(s => s.trim()).filter(Boolean) }
          : {};
        user = await signup(name, email.trim().toLowerCase(), password, role, extra);
      }
      const dest = user.role === 'provider' ? '/dashboard/provider'
                 : user.role === 'vendor'   ? '/dashboard/vendor'
                 : '/dashboard/customer';
      router.push(dest);
    } catch (err: unknown) {
      setServerError((err as Error).message ?? 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  const inp = (hasError?: string) => `form-input${hasError ? ' input-error' : ''}`;
  const cfg = ROLE_CONFIG[role];

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-visual" style={{ background: role === 'vendor' ? 'linear-gradient(135deg,#14532d,#166534)' : 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}>
        <div className="auth-visual-bg" />
        <div className="auth-illustration">
          <div className="nav-logo" style={{ marginBottom: 48 }}>
            <div className="logo-icon lg">S</div>
            <span className="logo-text lg" style={{ color: 'white' }}>ServeHub</span>
          </div>
          <h2>{cfg.heading}</h2>
          <p>{cfg.desc}</p>
          <div className="auth-features">
            {cfg.features.map((f) => (
              <div key={f} className="af-item"><span className="af-item-dot">✓</span>{f}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-form-wrap">
        <div className="auth-form-card">
          <h2>Create Account</h2>
          <p className="auth-sub">Already have one? <Link href="/login">Sign in</Link></p>

          {/* Role selector */}
          <div className="role-selector" style={{ marginBottom: 20 }}>
            {(['customer', 'provider', 'vendor'] as Role[]).map((r) => (
              <button
                key={r} type="button"
                className={`role-btn${role === r ? ' active' : ''}`}
                onClick={() => { setRole(r); setFieldErrors({}); setServerError(''); }}
                disabled={loading}
              >
                {ROLE_CONFIG[r].icon} {ROLE_CONFIG[r].label}
              </button>
            ))}
          </div>

          {serverError && <div className="form-alert form-alert-error">⚠ {serverError}</div>}

          <form onSubmit={handleSubmit} noValidate>

            {/* Customer / Provider name row */}
            {role !== 'vendor' && (
              <div className="form-row">
                <div className="form-group">
                  <label>First Name <span className="req">*</span></label>
                  <input type="text" className={inp(fieldErrors.firstName)} placeholder="John" value={firstName}
                    onChange={e => { setFirstName(e.target.value); clearErr('firstName'); }} disabled={loading} />
                  {fieldErrors.firstName && <span className="field-error">{fieldErrors.firstName}</span>}
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" className="form-input" placeholder="Doe" value={lastName}
                    onChange={e => setLastName(e.target.value)} disabled={loading} />
                </div>
              </div>
            )}

            {/* Vendor name row */}
            {role === 'vendor' && (
              <div className="form-row">
                <div className="form-group">
                  <label>Shop Name <span className="req">*</span></label>
                  <input type="text" className={inp(fieldErrors.shopName)} placeholder="My Awesome Shop" value={shopName}
                    onChange={e => { setShopName(e.target.value); clearErr('shopName'); }} disabled={loading} />
                  {fieldErrors.shopName && <span className="field-error">{fieldErrors.shopName}</span>}
                </div>
                <div className="form-group">
                  <label>Owner Name <span className="req">*</span></label>
                  <input type="text" className={inp(fieldErrors.ownerName)} placeholder="Your name" value={ownerName}
                    onChange={e => { setOwnerName(e.target.value); clearErr('ownerName'); }} disabled={loading} />
                  {fieldErrors.ownerName && <span className="field-error">{fieldErrors.ownerName}</span>}
                </div>
              </div>
            )}

            {/* Email */}
            <div className="form-group">
              <label>Email Address <span className="req">*</span></label>
              <input type="email" className={inp(fieldErrors.email)} placeholder="you@example.com" value={email}
                onChange={e => { setEmail(e.target.value); clearErr('email'); }} autoComplete="email" disabled={loading} />
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </div>

            {/* Provider fields */}
            {role === 'provider' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number <span className="req">*</span></label>
                    <input type="tel" className={inp(fieldErrors.phone)} placeholder="+1 (555) 000-0000" value={phone}
                      onChange={e => { setPhone(e.target.value); clearErr('phone'); }} disabled={loading} />
                    {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
                  </div>
                  <div className="form-group">
                    <label>City / Location <span className="req">*</span></label>
                    <input type="text" className={inp(fieldErrors.location)} placeholder="New York, NY" value={location}
                      onChange={e => { setLocation(e.target.value); clearErr('location'); }} disabled={loading} />
                    {fieldErrors.location && <span className="field-error">{fieldErrors.location}</span>}
                  </div>
                </div>
                <div className="form-group">
                  <label>Your Skills <span style={{ color: '#6b7280', fontWeight: 400 }}>(comma-separated)</span></label>
                  <input type="text" className="form-input" placeholder="e.g. Plumbing, Electrical" value={skills}
                    onChange={e => setSkills(e.target.value)} disabled={loading} />
                </div>
              </>
            )}

            {/* Vendor fields */}
            {role === 'vendor' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone <span className="req">*</span></label>
                    <input type="tel" className={inp(fieldErrors.phone)} placeholder="+91 98765 43210" value={phone}
                      onChange={e => { setPhone(e.target.value); clearErr('phone'); }} disabled={loading} />
                    {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
                  </div>
                  <div className="form-group">
                    <label>WhatsApp</label>
                    <input type="tel" className="form-input" placeholder="Same as phone or different" value={whatsapp}
                      onChange={e => setWhatsapp(e.target.value)} disabled={loading} />
                  </div>
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input type="text" className="form-input" placeholder="Mumbai, Delhi, etc." value={city}
                    onChange={e => setCity(e.target.value)} disabled={loading} />
                </div>
                <div className="form-group">
                  <label>Shop Description</label>
                  <textarea className="form-input form-textarea" placeholder="Tell customers what you sell…"
                    value={description} onChange={e => setDescription(e.target.value)} disabled={loading}
                    style={{ minHeight: 80 }} />
                </div>
              </>
            )}

            {/* Password */}
            <div className="form-group">
              <label>Password <span className="req">*</span></label>
              <div style={{ position: 'relative' }}>
                <input type={showPwd ? 'text' : 'password'} className={inp(fieldErrors.password)}
                  placeholder="At least 6 characters" value={password}
                  onChange={e => { setPassword(e.target.value); clearErr('password'); }}
                  autoComplete="new-password" disabled={loading} style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#6b7280' }}>
                  {showPwd ? '🙈' : '👁️'}
                </button>
              </div>
              {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
            </div>

            <div className="form-group">
              <label>Confirm Password <span className="req">*</span></label>
              <input type={showPwd ? 'text' : 'password'} className={inp(fieldErrors.confirmPassword)}
                placeholder="Re-enter your password" value={confirmPwd}
                onChange={e => { setConfirmPwd(e.target.value); clearErr('confirmPassword'); }}
                autoComplete="new-password" disabled={loading} />
              {fieldErrors.confirmPassword && <span className="field-error">{fieldErrors.confirmPassword}</span>}
            </div>

            <div className="form-check" style={{ alignItems: 'flex-start' }}>
              <input type="checkbox" id="agree" checked={agreed}
                onChange={e => { setAgreed(e.target.checked); if (e.target.checked) clearErr('agreed'); }} disabled={loading} />
              <label htmlFor="agree" style={{ cursor: 'pointer' }}>
                I agree to the <a href="#" style={{ color: 'var(--primary)' }}>Terms of Service</a> and{' '}
                <a href="#" style={{ color: 'var(--primary)' }}>Privacy Policy</a>
              </label>
            </div>
            {fieldErrors.agreed && <span className="field-error" style={{ marginTop: -8, marginBottom: 8, display: 'block' }}>{fieldErrors.agreed}</span>}

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}
              style={{ marginTop: 8, opacity: loading ? 0.75 : 1, cursor: loading ? 'not-allowed' : 'pointer',
                       background: role === 'vendor' ? 'linear-gradient(135deg,#16a34a,#15803d)' : undefined }}>
              {loading
                ? `Creating ${role} account…`
                : `Create ${role === 'provider' ? 'Provider' : role === 'vendor' ? 'Shop' : 'Customer'} Account →`}
            </button>
          </form>

          <div className="divider"><span>or sign up with</span></div>
          <div className="social-auth">
            <button className="social-btn"><span className="social-btn-icon">G</span> Google</button>
            <button className="social-btn"><span className="social-btn-icon">f</span> Facebook</button>
          </div>
        </div>
      </div>
    </div>
  );
}
