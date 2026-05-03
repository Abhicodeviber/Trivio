import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Promotion from '@/models/Promotion';
import { verifyToken } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    await connectDB();

    const { id } = await params;
    const promo = await Promotion.findById(id);
    if (!promo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (payload.role === 'vendor' && String(promo.vendorId) !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (payload.role !== 'admin' && payload.role !== 'vendor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const allowed = ['title', 'description', 'mediaType', 'mediaUrl', 'link', 'linkText', 'isActive', 'order', 'expiresAt'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = key === 'expiresAt' && body[key] ? new Date(body[key]) : body[key];
    }

    const updated = await Promotion.findByIdAndUpdate(id, { $set: update }, { new: true });
    return NextResponse.json({ promotion: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    await connectDB();

    const { id } = await params;
    const promo = await Promotion.findById(id);
    if (!promo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (payload.role === 'vendor' && String(promo.vendorId) !== payload.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (payload.role !== 'admin' && payload.role !== 'vendor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Promotion.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
