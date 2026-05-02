import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Provider from '@/models/Provider';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page     = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
    const limit    = Math.min(20, parseInt(searchParams.get('limit') ?? '12'));
    const location = searchParams.get('location');
    const skill    = searchParams.get('skill');

    const filter: Record<string, unknown> = { isSuspended: false };
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (skill)    filter.skills   = { $in: [new RegExp(skill, 'i')] };

    const [providers, total] = await Promise.all([
      Provider.find(filter)
        .select('-password')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Provider.countDocuments(filter),
    ]);

    return NextResponse.json({ providers, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
