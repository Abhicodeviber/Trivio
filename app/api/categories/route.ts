import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';
import Service from '@/models/Service';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();

    const counts = await Service.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countMap: Record<string, number> = {};
    for (const c of counts) countMap[String(c._id)] = c.count;

    const categoriesWithCount = categories.map(cat => ({
      ...cat,
      serviceCount: countMap[String(cat._id)] ?? 0,
    }));

    return NextResponse.json({ categories: categoriesWithCount });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (payload.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }
    await connectDB();
    const body = await req.json();
    const category = await Category.create(body);
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
