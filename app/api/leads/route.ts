import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Service from '@/models/Service';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { serviceId, contactType, visitorId } = await req.json();

    if (!serviceId || !contactType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const service = await Service.findById(serviceId).select('provider mobile whatsapp');
    if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

    // Attach customer ID if viewer is a logged-in customer
    let customerId: string | undefined;
    try {
      const token = getTokenFromRequest(req);
      if (token) {
        const payload = verifyToken(token);
        if (payload.role === 'customer') customerId = payload.userId;
      }
    } catch { /* anonymous visitor — fine */ }

    await Lead.create({
      service:     serviceId,
      provider:    service.provider,
      customer:    customerId,
      contactType,
      visitorId:   visitorId ?? null,
    });

    const number = contactType === 'whatsapp' ? service.whatsapp : service.mobile;
    return NextResponse.json({ number }, { status: 201 });
  } catch (err) {
    console.error('[POST lead]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (payload.role !== 'provider') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));

    const [leads, total] = await Promise.all([
      Lead.find({ provider: payload.userId })
        .populate('service', 'title')
        .populate('customer', 'name email phone')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Lead.countDocuments({ provider: payload.userId }),
    ]);

    return NextResponse.json({ leads, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[GET leads]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
