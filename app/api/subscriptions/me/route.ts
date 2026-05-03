import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import VendorSubscription from '@/models/VendorSubscription';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (payload.role !== 'vendor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();

    // expire any overdue active subs
    await VendorSubscription.updateMany(
      { vendorId: payload.userId, status: 'active', expiresAt: { $lt: new Date() } },
      { $set: { status: 'expired' } }
    );

    const sub = await VendorSubscription.findOne(
      { vendorId: payload.userId, status: 'active' },
      {},
      { sort: { expiresAt: -1 } }
    ).populate('planId', 'name durationDays maxPromotions').lean();

    return NextResponse.json({ subscription: sub ?? null });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
