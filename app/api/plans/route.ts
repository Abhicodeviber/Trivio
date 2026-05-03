import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Plan from '@/models/Plan';
import { verifyToken } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();
    const plans = await Plan.find({ isActive: true }).sort({ order: 1, price: 1 }).lean();
    return NextResponse.json({ plans });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const body = await req.json();
    const { name, description, price, durationDays, maxPromotions, features, isActive, isPopular, order } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!price || price <= 0) return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
    if (!durationDays || durationDays < 1) return NextResponse.json({ error: 'Valid duration is required' }, { status: 400 });
    if (!maxPromotions || maxPromotions < 1) return NextResponse.json({ error: 'At least 1 promotion slot required' }, { status: 400 });

    const plan = await Plan.create({
      name:          name.trim(),
      description:   description?.trim() ?? '',
      price:         Number(price),
      durationDays:  Number(durationDays),
      maxPromotions: Number(maxPromotions),
      features:      Array.isArray(features) ? features.filter(Boolean) : [],
      isActive:      isActive !== false,
      isPopular:     isPopular === true,
      order:         Number(order) || 0,
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
