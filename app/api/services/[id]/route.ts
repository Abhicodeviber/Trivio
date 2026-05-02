import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Service from '@/models/Service';
import { requireAuth } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const service = await Service.findById(id)
      .populate('provider', 'name avatar location bio skills rating reviewCount')
      .populate('category', 'name slug icon description fields');
    if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    return NextResponse.json({ service });
  } catch (err) {
    console.error('[GET service]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    await connectDB();
    const { id } = await params;

    const existing = await Service.findById(id).select('provider');
    if (!existing) return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    if (String(existing.provider) !== payload.userId && payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    console.log('[PATCH service] body received:', JSON.stringify(body));

    const allowed = ['title', 'description', 'category', 'price', 'priceType', 'tags',
      'images', 'isActive', 'deliveryTime', 'mobile', 'whatsapp', 'videoUrl', 'customFields'] as const;

    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        update[key] = body[key];
      }
    }

    console.log('[PATCH service] update to apply:', JSON.stringify(update));

    const updated = await Service.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true, runValidators: false, strict: false }
    ).populate('category', 'name slug icon');

    if (!updated) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

    console.log('[PATCH service] saved mobile:', updated.mobile, 'whatsapp:', updated.whatsapp);
    return NextResponse.json({ service: updated });
  } catch (err: unknown) {
    console.error('[PATCH service] error:', err);
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    await connectDB();
    const { id } = await params;
    const service = await Service.findById(id);
    if (!service) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (String(service.provider) !== payload.userId && payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await service.deleteOne();
    return NextResponse.json({ message: 'Service deleted' });
  } catch (err) {
    console.error('[DELETE service]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
