import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Review from '@/models/Review';
import Booking from '@/models/Booking';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const providerId = searchParams.get('provider');
    const serviceId = searchParams.get('service');

    const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));

    const filter: Record<string, unknown> = {};
    if (providerId) filter.provider = providerId;
    if (serviceId) filter.service = serviceId;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('customer', 'name avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    return NextResponse.json({ reviews, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (payload.role !== 'customer') {
      return NextResponse.json({ error: 'Only customers can leave reviews' }, { status: 403 });
    }
    await connectDB();
    const { bookingId, rating, comment } = await req.json();

    const booking = await Booking.findById(bookingId);
    if (!booking || String(booking.customer) !== payload.userId) {
      return NextResponse.json({ error: 'Invalid booking' }, { status: 400 });
    }
    if (booking.status !== 'completed') {
      return NextResponse.json({ error: 'Can only review completed bookings' }, { status: 400 });
    }

    const review = await Review.create({
      service: booking.service,
      booking: bookingId,
      customer: payload.userId,
      provider: booking.provider,
      rating,
      comment,
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (err: unknown) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ error: 'Already reviewed this booking' }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
