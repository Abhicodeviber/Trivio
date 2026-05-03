import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import Conversation from '@/models/Conversation';

/* GET /api/chat/unread — total unread conversation count for the logged-in user */
export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    await connectDB();
    const count = await Conversation.countDocuments({ unreadFor: payload.userId });
    return NextResponse.json({ count });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'Unauthorized') return NextResponse.json({ count: 0 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
