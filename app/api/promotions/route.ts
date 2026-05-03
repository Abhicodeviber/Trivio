import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Promotion from '@/models/Promotion';
import VendorSubscription from '@/models/VendorSubscription';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const all    = searchParams.get('all') === 'true'; // admin/vendor: fetch own
    const vendor = searchParams.get('vendorId');

    const token = req.cookies.get('token')?.value;
    let role = '', userId = '';
    if (token) {
      try { const p = verifyToken(token); role = p.role; userId = p.userId; } catch { /* public */ }
    }

    let filter: Record<string, unknown> = {};

    if (all && role === 'admin') {
      // admin sees everything
    } else if (all && role === 'vendor') {
      filter = { vendorId: userId };
    } else if (vendor) {
      filter = { isActive: true, vendorId: vendor };
    } else {
      // public: active, not expired
      filter = {
        isActive: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      };
    }

    const promotions = await Promotion.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ promotions });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (payload.role !== 'admin' && payload.role !== 'vendor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { title, description, mediaType, mediaUrl, link, linkText, isActive, order, expiresAt } = body;

    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

    // Vendors must have an active subscription with slots available
    if (payload.role === 'vendor') {
      const now = new Date();
      const activeSub = await VendorSubscription.findOne({
        vendorId: payload.userId,
        status: 'active',
        expiresAt: { $gt: now },
        $expr: { $lt: ['$promotionsUsed', '$maxPromotions'] },
      });
      if (!activeSub) {
        return NextResponse.json({ error: 'No active plan with available promotion slots. Please purchase a plan.' }, { status: 403 });
      }
    }

    const promo = await Promotion.create({
      title:         title.trim(),
      description:   description?.trim() ?? '',
      mediaType:     mediaType ?? 'image',
      mediaUrl:      mediaUrl?.trim() ?? '',
      link:          link?.trim() || '/',
      linkText:      linkText?.trim() || 'Learn More',
      createdByRole: payload.role,
      vendorId:      payload.role === 'vendor' ? payload.userId : undefined,
      isActive:      isActive !== false,
      order:         order ?? 0,
      expiresAt:     expiresAt ? new Date(expiresAt) : undefined,
    });

    // Increment promotionsUsed for vendor
    if (payload.role === 'vendor') {
      await VendorSubscription.findOneAndUpdate(
        { vendorId: payload.userId, status: 'active', expiresAt: { $gt: new Date() } },
        { $inc: { promotionsUsed: 1 } },
        { sort: { expiresAt: -1 } }
      );
    }

    return NextResponse.json({ promotion: promo }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
