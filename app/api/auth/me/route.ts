import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Customer from '@/models/Customer';
import Provider from '@/models/Provider';
import User from '@/models/User';
import Vendor from '@/models/Vendor';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    await connectDB();

    let user;
    switch (payload.role) {
      case 'customer': user = await Customer.findById(payload.userId); break;
      case 'provider': user = await Provider.findById(payload.userId); break;
      case 'vendor':   user = await Vendor.findById(payload.userId);   break;
      default:         user = await User.findById(payload.userId);
    }

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ user: { ...user.toJSON(), role: payload.role } });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
