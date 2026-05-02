import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Booking from '@/models/Booking';
import Service from '@/models/Service';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));

    const filter: Record<string, unknown> =
      payload.role === 'customer' ? { customer: payload.userId } :
      payload.role === 'provider' ? { provider: payload.userId } : {};

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate('service', 'title price')
        .populate('customer', 'name avatar')
        .populate('provider', 'name avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    return NextResponse.json({ bookings, total, page, pages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (payload.role !== 'customer') {
      return NextResponse.json({ error: 'Only customers can book services' }, { status: 403 });
    }
    await connectDB();
    const { serviceId, scheduledDate, notes, address } = await req.json();

    const service = await Service.findById(serviceId);
    if (!service || !service.isActive) {
      return NextResponse.json({ error: 'Service not available' }, { status: 404 });
    }

    const booking = await Booking.create({
      service: serviceId,
      customer: payload.userId,
      provider: service.provider,
      scheduledDate,
      totalAmount: service.price,
      notes,
      address,
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
