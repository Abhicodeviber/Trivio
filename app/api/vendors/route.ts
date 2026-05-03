import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Vendor from '@/models/Vendor';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page     = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
    const limit    = Math.min(20, parseInt(searchParams.get('limit') ?? '12'));
    const search   = searchParams.get('search');
    const city     = searchParams.get('city');
    const category = searchParams.get('category');
    const nearLat  = searchParams.get('nearLat');
    const nearLng  = searchParams.get('nearLng');
    const radius   = parseFloat(searchParams.get('radius') ?? '10'); // km

    const filter: Record<string, unknown> = { isActive: true, isApproved: true };
    if (search) {
      filter.$or = [
        { shopName:    { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (city)     filter.city       = { $regex: city, $options: 'i' };
    if (category) filter.categories = category;

    // Nearby filter — requires vendors to have location set
    if (nearLat && nearLng) {
      filter.location = {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(nearLng), parseFloat(nearLat)] },
          $maxDistance: radius * 1000, // metres
        },
      };
    }

    const [vendors, total] = await Promise.all([
      Vendor.find(filter).select('-password').sort(nearLat ? {} : { createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Vendor.countDocuments(filter),
    ]);

    return NextResponse.json({ vendors, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
