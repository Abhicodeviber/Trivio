import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { connectDB } from '@/lib/mongodb';
import Plan from '@/models/Plan';
import VendorSubscription from '@/models/VendorSubscription';
import { verifyToken } from '@/lib/auth';

const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID     ?? '',
  key_secret: process.env.RAZORPAY_KEY_SECRET ?? '',
});

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (payload.role !== 'vendor') return NextResponse.json({ error: 'Only vendors can purchase plans' }, { status: 403 });

    await connectDB();
    const { planId } = await req.json();
    if (!planId) return NextResponse.json({ error: 'planId is required' }, { status: 400 });

    const plan = await Plan.findById(planId);
    if (!plan || !plan.isActive) return NextResponse.json({ error: 'Plan not found or inactive' }, { status: 404 });

    const amountPaise = Math.round(plan.price * 100);

    // receipt max 40 chars — use last 8 of vendorId + base36 timestamp
    const receipt = `sub_${payload.userId.slice(-8)}_${Date.now().toString(36)}`;

    const order = await razorpay.orders.create({
      amount:   amountPaise,
      currency: 'INR',
      receipt,
      notes:    { vendorId: payload.userId, planId: String(planId) },
    });

    await VendorSubscription.create({
      vendorId:        payload.userId,
      planId:          plan._id,
      razorpayOrderId: order.id,
      status:          'pending',
      maxPromotions:   plan.maxPromotions,
      amount:          plan.price,
    });

    return NextResponse.json({
      orderId:  order.id,
      amount:   amountPaise,
      currency: 'INR',
      keyId:    process.env.RAZORPAY_KEY_ID,
      planName: plan.name,
    });
  } catch (err) {
    console.error('create-order error:', err);
    const msg = (err as { error?: { description?: string }; message?: string })?.error?.description
      ?? (err as Error)?.message
      ?? 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
