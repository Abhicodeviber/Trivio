import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import Conversation from '@/models/Conversation';

/* GET /api/chat/conversations/[id]/messages */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const after = searchParams.get('after');

    const convo = await Conversation.findById(id).lean();
    if (!convo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const isParticipant = (convo.participants as { userId: string }[]).some(p => p.userId === payload.userId);
    if (!isParticipant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // Filter messages in JS — avoids aggregation complexity and messages arrays are small
    let messages = convo.messages as { _id: unknown; createdAt: Date }[];
    if (after) {
      const afterDate = new Date(after);
      messages = messages.filter(m => m.createdAt > afterDate);
    }

    // Mark as read
    await Conversation.findByIdAndUpdate(id, { $pull: { unreadFor: payload.userId } });

    return NextResponse.json({ messages });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/* POST /api/chat/conversations/[id]/messages — send a message */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    await connectDB();
    const { id } = await params;
    const { content, senderName } = await req.json();

    if (!content?.trim()) return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    if (content.trim().length > 2000) return NextResponse.json({ error: 'Message too long' }, { status: 400 });

    const convo = await Conversation.findById(id).lean();
    if (!convo) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });

    const participants = convo.participants as { userId: string; name: string }[];
    const isParticipant = participants.some(p => p.userId === payload.userId);
    if (!isParticipant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const otherIds = participants.filter(p => p.userId !== payload.userId).map(p => p.userId);
    const name = senderName ?? participants.find(p => p.userId === payload.userId)?.name ?? 'User';
    const trimmed = content.trim();
    const now = new Date();
    const msgId = new mongoose.Types.ObjectId();

    const newMsg = {
      _id:        msgId,
      senderId:   payload.userId,
      senderRole: payload.role as 'customer' | 'vendor' | 'provider',
      senderName: name,
      content:    trimmed,
      createdAt:  now,
    };

    // Push message into the embedded array and update preview + unread
    await Conversation.findByIdAndUpdate(id, {
      $push:      { messages: newMsg },
      lastMessage:   trimmed.slice(0, 80),
      lastMessageAt: now,
      $addToSet:  { unreadFor: { $each: otherIds } },
    });

    return NextResponse.json({ message: newMsg }, { status: 201 });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
