import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import VendorSubscription from '@/models/VendorSubscription';
import Plan from '@/models/Plan';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (payload.role !== 'vendor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    // Verify HMAC signature
    const secret = process.env.RAZORPAY_KEY_SECRET ?? '';
    const body   = razorpay_order_id + '|' + razorpay_payment_id;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (expected !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    await connectDB();

    const sub = await VendorSubscription.findOne({
      razorpayOrderId: razorpay_order_id,
      vendorId:        payload.userId,
    });
    if (!sub) return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    if (sub.status === 'active') return NextResponse.json({ ok: true, message: 'Already activated' });

    const plan = await Plan.findById(sub.planId);
    const now  = new Date();
    const exp  = new Date(now);
    exp.setDate(exp.getDate() + (plan?.durationDays ?? 30));

    sub.razorpayPaymentId = razorpay_payment_id;
    sub.razorpaySignature = razorpay_signature;
    sub.status    = 'active';
    sub.startsAt  = now;
    sub.expiresAt = exp;
    await sub.save();

    return NextResponse.json({ ok: true, expiresAt: exp });
  } catch (err) {
    console.error('verify error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
