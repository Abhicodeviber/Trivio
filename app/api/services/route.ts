import { NextRequest, NextResponse } from 'next/server';
import { SortOrder } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import Service from '@/models/Service';
import Category from '@/models/Category';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page      = Math.max(1, parseInt(searchParams.get('page')     ?? '1'));
    const limit     = Math.min(20, parseInt(searchParams.get('limit')   ?? '12'));
    const category  = searchParams.get('category');
    const provider  = searchParams.get('provider');
    const q         = searchParams.get('q');
    const minPrice  = searchParams.get('minPrice');
    const maxPrice  = searchParams.get('maxPrice');
    const minRating = searchParams.get('minRating');
    const sort      = searchParams.get('sort') ?? 'createdAt';

    const filter: Record<string, unknown> = { isActive: true };
    if (category) filter.category = category;
    if (provider) filter.provider = provider;
    if (q) filter.$text = { $search: q };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) (filter.price as Record<string, number>).$gte = parseFloat(minPrice);
      if (maxPrice) (filter.price as Record<string, number>).$lte = parseFloat(maxPrice);
    }
    if (minRating) filter.rating = { $gte: parseFloat(minRating) };

    const sortMap: Record<string, Record<string, SortOrder>> = {
      price_asc: { price: 1 }, price_desc: { price: -1 },
      rating: { rating: -1 }, createdAt: { createdAt: -1 },
    };

    const [services, total] = await Promise.all([
      Service.find(filter)
        .populate('provider', 'name avatar location')
        .populate('category', 'name slug icon')
        .sort(sortMap[sort] ?? { createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Service.countDocuments(filter),
    ]);

    return NextResponse.json({ services, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (payload.role !== 'provider') {
      return NextResponse.json({ error: 'Only providers can add services' }, { status: 403 });
    }
    await connectDB();
    const body = await req.json();
    const { title, description, categoryId, price, priceType, deliveryTime, tags, mobile, whatsapp, videoUrl, customFields } = body;

    // Validate required fields
    if (!title?.trim())       return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!description?.trim()) return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    if (!categoryId)          return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    if (!price || price <= 0) return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
    if (!mobile?.trim())      return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
    if (!whatsapp?.trim())    return NextResponse.json({ error: 'WhatsApp number is required' }, { status: 400 });

    // Validate category exists
    const category = await Category.findById(categoryId);
    if (!category) return NextResponse.json({ error: 'Invalid category' }, { status: 400 });

    // Validate required dynamic fields
    for (const field of category.fields) {
      if (field.required && !customFields?.[field.name]) {
        return NextResponse.json({ error: `${field.label} is required` }, { status: 400 });
      }
    }

    const service = await Service.create({
      title: title.trim(),
      description: description.trim(),
      category: categoryId,
      provider: payload.userId,
      price: parseFloat(price),
      priceType: priceType ?? 'hourly',
      deliveryTime: deliveryTime?.trim(),
      mobile: mobile.trim(),
      whatsapp: whatsapp.trim(),
      videoUrl: videoUrl?.trim() ?? '',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []),
      customFields: customFields ?? {},
    });

    const populated = await service.populate('category', 'name slug icon');
    return NextResponse.json({ service: populated }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
