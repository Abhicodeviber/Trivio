import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Customer from '@/models/Customer';
import Provider from '@/models/Provider';
import Service from '@/models/Service';
import Booking from '@/models/Booking';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const [totalCustomers, totalProviders, totalServices, totalBookings, revenue] =
      await Promise.all([
        Customer.countDocuments(),
        Provider.countDocuments(),
        Service.countDocuments({ isActive: true }),
        Booking.countDocuments(),
        Booking.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),
      ]);

    return NextResponse.json({
      totalUsers: totalCustomers + totalProviders,
      totalCustomers,
      totalProviders,
      totalServices,
      totalBookings,
      revenue: revenue[0]?.total ?? 0,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
