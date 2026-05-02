import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Booking from '@/models/Booking';
import { requireAuth } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    await connectDB();
    const { id } = await params;
    const { status } = await req.json();

    const booking = await Booking.findById(id);
    if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isProvider = String(booking.provider) === payload.userId;
    const isCustomer = String(booking.customer) === payload.userId;
    const isAdmin = payload.role === 'admin';

    if (!isProvider && !isCustomer && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Customers can only cancel; providers can confirm/start/complete/cancel
    const providerAllowed = ['confirmed', 'in_progress', 'completed', 'cancelled'];
    const customerAllowed = ['cancelled'];
    const allowed = isAdmin ? providerAllowed : isProvider ? providerAllowed : customerAllowed;

    if (!allowed.includes(status)) {
      return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 });
    }

    booking.status = status;
    await booking.save();
    return NextResponse.json({ booking });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
