import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Vendor from '@/models/Vendor';
import { requireAuth } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const vendor = await Vendor.findById(id).select('-password -email -phone -whatsapp');
    if (!vendor || !vendor.isActive) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }
    return NextResponse.json({ vendor });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    await connectDB();
    const { id } = await params;

    if (payload.role !== 'vendor' && payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (payload.role === 'vendor' && payload.userId !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const allowed = ['shopName', 'ownerName', 'phone', 'whatsapp', 'city', 'address', 'description', 'logo', 'photos', 'youtube', 'instagram', 'categories'];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    // Store lat/lng as GeoJSON Point for $nearSphere queries
    const lat = body.lat !== undefined ? parseFloat(body.lat) : undefined;
    const lng = body.lng !== undefined ? parseFloat(body.lng) : undefined;
    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      update.location = { type: 'Point', coordinates: [lng, lat] };
    }

    const vendor = await Vendor.findByIdAndUpdate(id, { $set: update }, { new: true }).select('-password');
    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    return NextResponse.json({ vendor });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
