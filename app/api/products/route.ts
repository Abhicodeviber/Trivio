import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Product from '@/models/Product';
import Vendor from '@/models/Vendor';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page     = Math.max(1, parseInt(searchParams.get('page')     ?? '1'));
    const limit    = Math.min(20, parseInt(searchParams.get('limit')   ?? '12'));
    const search   = searchParams.get('search') ?? searchParams.get('q');
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const inStock  = searchParams.get('inStock');
    const vendorId = searchParams.get('vendorId');
    const sort     = searchParams.get('sort') ?? 'createdAt';

    const filter: Record<string, unknown> = {};
    if (vendorId)  filter.vendor   = vendorId;
    if (category)  filter.category = category;
    if (search)    filter.$text    = { $search: search };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) (filter.price as Record<string, number>).$gte = parseFloat(minPrice);
      if (maxPrice) (filter.price as Record<string, number>).$lte = parseFloat(maxPrice);
    }
    if (inStock === 'true')  filter.inStock = true;
    if (inStock === 'false') filter.inStock = false;

    const sortMap: Record<string, Record<string, number>> = {
      price_asc:  { price: 1 },
      price_desc: { price: -1 },
      createdAt:  { createdAt: -1 },
    };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('vendor', 'shopName ownerName city logo rating reviewCount')
        .select('-mobile -whatsapp')
        .sort(sortMap[sort] ?? { createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return NextResponse.json({ products, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (payload.role !== 'vendor') {
      return NextResponse.json({ error: 'Only vendors can add products' }, { status: 403 });
    }
    await connectDB();
    const body = await req.json();
    const { title, description, category, price, unit, images, tags, inStock, customFields } = body;

    if (!title?.trim())       return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!price || price <= 0) return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });

    // Inherit contact from vendor
    const vendor = await Vendor.findById(payload.userId).select('phone whatsapp');
    const mobile   = vendor?.phone   ?? '';
    const whatsapp = vendor?.whatsapp ?? '';

    const product = await Product.create({
      title:        title.trim(),
      description:  description?.trim() ?? '',
      vendor:       payload.userId,
      category:     category?.trim() ?? '',
      price:        parseFloat(price),
      unit:         unit ?? 'piece',
      images:       Array.isArray(images) ? images : [],
      tags:         Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map((t: string) => t.trim()).filter(Boolean) : []),
      inStock:      inStock !== false,
      mobile,
      whatsapp,
      customFields: customFields ?? {},
    });

    const populated = await product.populate('vendor', 'shopName city logo');
    return NextResponse.json({ product: populated }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
