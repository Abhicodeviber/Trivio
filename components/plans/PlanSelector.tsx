'use client';
import { useEffect, useState } from 'react';

interface Plan {
  _id: string;
  name: string;
  description: string;
  price: number;
  durationDays: number;
  maxPromotions: number;
  features: string[];
  isActive: boolean;
  isPopular: boolean;
}

interface Subscription {
  _id: string;
  planId: { _id: string; name: string; durationDays: number; maxPromotions: number };
  status: string;
  maxPromotions: number;
  promotionsUsed: number;
  startsAt: string;
  expiresAt: string;
  amount: number;
}

interface Props {
  onSubscribed?: () => void;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(resolve => {
    if (typeof window !== 'undefined' && window.Razorpay) { resolve(true); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function daysLeft(exp: string) {
  const diff = new Date(exp).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export default function PlanSelector({ onSubscribed }: Props) {
  const [plans,   setPlans]   = useState<Plan[]>([]);
  const [sub,     setSub]     = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying,  setPaying]  = useState<string | null>(null);
  const [notice,  setNotice]  = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const notify = (type: 'ok' | 'err', msg: string) => {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 5000);
  };

  function loadData() {
    setLoading(true);
    Promise.all([
      fetch('/api/plans').then(r => r.json()),
      fetch('/api/subscriptions/me').then(r => r.json()),
    ]).then(([pd, sd]) => {
      setPlans(pd.plans ?? []);
      setSub(sd.subscription ?? null);
    }).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  async function handleBuy(plan: Plan) {
    setPaying(plan._id);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { notify('err', 'Could not load payment gateway. Check your connection.'); return; }

      const res  = await fetch('/api/subscriptions/create-order', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan._id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Order creation failed');

      const options = {
        key:         data.keyId,
        amount:      data.amount,
        currency:    data.currency,
        name:        'ServeHub Promotions',
        description: `${plan.name} Plan`,
        order_id:    data.orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const vRes = await fetch('/api/subscriptions/verify', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
              }),
            });
            const vData = await vRes.json();
            if (!vRes.ok) throw new Error(vData.error ?? 'Verification failed');
            notify('ok', `🎉 Payment successful! Your ${plan.name} plan is now active.`);
            loadData();
            onSubscribed?.();
          } catch (e: unknown) {
            notify('err', (e as Error).message);
          }
        },
        prefill:       {},
        theme:         { color: '#16a34a' },
        modal:         { ondismiss: () => setPaying(null) },
      };

      const rz = new window.Razorpay(options);
      rz.open();
    } catch (e: unknown) {
      notify('err', (e as Error).message);
    } finally {
      setPaying(null);
    }
  }

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-light)' }}>Loading plans…</div>
  );

  return (
    <div>
      {notice && (
        <div style={{ padding: '12px 16px', borderRadius: 10, marginBottom: 20, fontSize: 14, fontWeight: 500,
          background: notice.type === 'ok' ? '#d1fae5' : '#fee2e2',
          color:      notice.type === 'ok' ? '#065f46' : '#991b1b',
          border: `1px solid ${notice.type === 'ok' ? '#6ee7b7' : '#fca5a5'}` }}>
          {notice.msg}
        </div>
      )}

      {/* Active Subscription */}
      {sub && (
        <div style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #86efac', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#14532d', marginBottom: 4 }}>
                ✅ Active Plan: {sub.planId?.name ?? 'Pro'}
              </div>
              <div style={{ fontSize: 14, color: '#166534' }}>
                {sub.promotionsUsed} / {sub.maxPromotions} promotions used
              </div>
              {sub.expiresAt && (
                <div style={{ fontSize: 13, color: '#16a34a', marginTop: 4 }}>
                  ⏰ Expires {new Date(sub.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' '}({daysLeft(sub.expiresAt)} days left)
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>
                {sub.maxPromotions - sub.promotionsUsed}
              </div>
              <div style={{ fontSize: 12, color: '#166534' }}>slots available</div>
            </div>
          </div>

          {/* Usage bar */}
          <div style={{ marginTop: 12, height: 6, background: '#bbf7d0', borderRadius: 99 }}>
            <div style={{
              height: '100%', borderRadius: 99,
              background: 'linear-gradient(90deg,#16a34a,#15803d)',
              width: `${Math.min(100, (sub.promotionsUsed / sub.maxPromotions) * 100)}%`,
              transition: 'width 0.4s',
            }} />
          </div>
        </div>
      )}

      {/* Plans grid */}
      <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
        {sub ? 'Upgrade or Renew Plan' : 'Choose a Plan to Start Promoting'}
      </h3>

      {plans.length === 0 ? (
        <div className="content-card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>😕</div>
          <p style={{ color: 'var(--text-light)' }}>No plans available right now. Please check back soon.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 16 }}>
          {plans.map(plan => (
            <div key={plan._id}
              style={{ position: 'relative', background: '#fff', border: `2px solid ${plan.isPopular ? '#16a34a' : 'var(--border)'}`,
                borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12,
                boxShadow: plan.isPopular ? '0 4px 20px rgba(22,163,74,0.15)' : 'none',
                transition: 'box-shadow 0.2s' }}>
              {plan.isPopular && (
                <div style={{ position: 'absolute', top: -1, right: 16, background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 12px', borderRadius: '0 0 8px 8px', letterSpacing: '0.05em' }}>
                  POPULAR
                </div>
              )}

              <div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{plan.name}</div>
                {plan.description && <div style={{ fontSize: 13, color: 'var(--text-light)' }}>{plan.description}</div>}
              </div>

              <div>
                <span style={{ fontSize: 30, fontWeight: 800, color: '#16a34a' }}>₹{plan.price.toLocaleString('en-IN')}</span>
                <span style={{ fontSize: 13, color: 'var(--text-light)' }}> / {plan.durationDays} days</span>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#ede9fe', color: '#6d28d9' }}>
                  🎯 {plan.maxPromotions} promo{plan.maxPromotions > 1 ? 's' : ''}
                </span>
                <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: '#dbeafe', color: '#1d4ed8' }}>
                  📅 {plan.durationDays}d
                </span>
              </div>

              {plan.features.length > 0 && (
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 13, color: 'var(--text-light)', lineHeight: 1.9 }}>
                  {plan.features.map((f, i) => <li key={i}>✓ {f}</li>)}
                </ul>
              )}

              <button
                onClick={() => handleBuy(plan)}
                disabled={paying === plan._id}
                style={{
                  marginTop: 'auto', padding: '10px', borderRadius: 8, border: 'none', cursor: paying === plan._id ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: 14,
                  background: plan.isPopular ? 'linear-gradient(135deg,#16a34a,#15803d)' : 'linear-gradient(135deg,#334155,#1e293b)',
                  color: '#fff', opacity: paying === plan._id ? 0.7 : 1,
                  transition: 'opacity 0.2s',
                }}>
                {paying === plan._id ? '⏳ Processing…' : `Subscribe — ₹${plan.price.toLocaleString('en-IN')}`}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
