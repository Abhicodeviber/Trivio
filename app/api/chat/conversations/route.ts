import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import Conversation from '@/models/Conversation';
import Customer from '@/models/Customer';
import Vendor from '@/models/Vendor';
import Provider from '@/models/Provider';

/* Resolve display name for any user role */
async function resolveName(userId: string, role: string): Promise<string> {
  try {
    if (role === 'customer') {
      const u = await Customer.findById(userId).select('name').lean();
      return (u as { name?: string })?.name ?? 'Customer';
    }
    if (role === 'vendor') {
      const u = await Vendor.findById(userId).select('shopName ownerName').lean();
      const v = u as { shopName?: string; ownerName?: string } | null;
      return v?.shopName ?? v?.ownerName ?? 'Vendor';
    }
    if (role === 'provider') {
      const u = await Provider.findById(userId).select('name').lean();
      return (u as { name?: string })?.name ?? 'Provider';
    }
  } catch { /* ignore */ }
  return 'User';
}

/* GET /api/chat/conversations — list my conversations */
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    await connectDB();

    const convos = await Conversation.find({ 'participants.userId': payload.userId })
      .select('-messages')
      .sort({ lastMessageAt: -1 })
      .lean();

    return NextResponse.json({ conversations: convos });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/* POST /api/chat/conversations — start or get existing conversation */
export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    await connectDB();

    const { targetUserId, targetRole } = await req.json();
    if (!targetUserId || !targetRole) {
      return NextResponse.json({ error: 'targetUserId and targetRole required' }, { status: 400 });
    }
    if (targetUserId === payload.userId) {
      return NextResponse.json({ error: 'Cannot chat with yourself' }, { status: 400 });
    }

    // Find existing conversation between these two users
    const existing = await Conversation.findOne({
      'participants.userId': { $all: [payload.userId, targetUserId] },
      $expr: { $eq: [{ $size: '$participants' }, 2] },
    });
    if (existing) return NextResponse.json({ conversation: existing });

    // Resolve names for both sides
    const [myName, theirName] = await Promise.all([
      resolveName(payload.userId, payload.role),
      resolveName(targetUserId, targetRole),
    ]);

    const convo = await Conversation.create({
      participants: [
        { userId: payload.userId, role: payload.role, name: myName },
        { userId: targetUserId,   role: targetRole,   name: theirName },
      ],
      lastMessage:   '',
      lastMessageAt: new Date(),
      unreadFor:     [],
    });

    return NextResponse.json({ conversation: convo }, { status: 201 });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
