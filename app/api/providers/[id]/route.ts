import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Provider from '@/models/Provider';
import Service from '@/models/Service';
import Review from '@/models/Review';
import { requireAuth } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const provider = await Provider.findById(id).select('-password');
    if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

    const [services, reviews] = await Promise.all([
      Service.find({ provider: id, isActive: true }),
      Review.find({ provider: id })
        .populate('customer', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    return NextResponse.json({ provider, services, reviews });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    const { id } = await params;
    if (payload.userId !== id && payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await connectDB();
    const body = await req.json();
    const allowed = ['name', 'phone', 'location', 'bio', 'skills', 'avatar'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }
    const provider = await Provider.findByIdAndUpdate(id, update, { new: true }).select('-password');
    return NextResponse.json({ provider });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
