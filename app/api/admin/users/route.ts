import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Customer from '@/models/Customer';
import Provider from '@/models/Provider';
import { requireAuth } from '@/lib/auth';

function requireAdmin(req: NextRequest) {
  const payload = requireAuth(req);
  if (payload.role !== 'admin') throw new Error('Forbidden');
  return payload;
}

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req);
    await connectDB();

    const { searchParams } = new URL(req.url);
    const type  = searchParams.get('type'); // 'customer' | 'provider' | null (both)
    const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
    const skip  = (page - 1) * limit;

    if (type === 'customer') {
      const [users, total] = await Promise.all([
        Customer.find().select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }),
        Customer.countDocuments(),
      ]);
      return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit), type: 'customer' });
    }

    if (type === 'provider') {
      const [users, total] = await Promise.all([
        Provider.find().select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }),
        Provider.countDocuments(),
      ]);
      return NextResponse.json({ users, total, page, pages: Math.ceil(total / limit), type: 'provider' });
    }

    // Both collections combined
    const [customers, providers, totalC, totalP] = await Promise.all([
      Customer.find().select('-password').sort({ createdAt: -1 }).limit(limit),
      Provider.find().select('-password').sort({ createdAt: -1 }).limit(limit),
      Customer.countDocuments(),
      Provider.countDocuments(),
    ]);

    return NextResponse.json({
      customers, providers,
      totalCustomers: totalC,
      totalProviders: totalP,
    });
  } catch (err: unknown) {
    const msg = (err as Error).message;
    return NextResponse.json({ error: msg }, { status: msg === 'Forbidden' ? 403 : 401 });
  }
}
