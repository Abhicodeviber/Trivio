import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import VendorLead from '@/models/VendorLead';
import { verifyToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { productId, vendorId } = await req.json();

    if (!productId || !vendorId) {
      return NextResponse.json({ error: 'productId and vendorId are required' }, { status: 400 });
    }

    // Find product (need actual mobile/whatsapp — query without select exclusion)
    const product = await Product.findById(productId);
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    // Optionally attach customer if logged in
    let customerId: string | null = null;
    let customerRole: string | null = null;
    const token = req.cookies.get('token')?.value;
    if (token) {
      try {
        const p = verifyToken(token);
        if (p.role === 'customer') {
          customerId = p.userId;
          customerRole = p.role;
        }
      } catch { /* anonymous */ }
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';

    await VendorLead.create({
      productId,
      vendorId,
      customerId: customerId ?? undefined,
      customerRole: customerRole ?? undefined,
      contactType: 'mobile',
      ip,
    });

    return NextResponse.json({
      mobile:   product.mobile,
      whatsapp: product.whatsapp,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (payload.role !== 'vendor') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));

    const [leads, total] = await Promise.all([
      VendorLead.find({ vendorId: payload.userId })
        .populate('productId', 'title category price')
        .populate('customerId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      VendorLead.countDocuments({ vendorId: payload.userId }),
    ]);

    return NextResponse.json({ leads, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
