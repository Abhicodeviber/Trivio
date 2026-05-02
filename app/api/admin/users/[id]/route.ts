import { NextRequest, NextResponse } from 'next/server';
import { Model, Document } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import Customer from '@/models/Customer';
import Provider from '@/models/Provider';
import { requireAuth } from '@/lib/auth';

// type query param: 'customer' | 'provider'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getModel(type: string | null): Model<any & Document> {
  if (type === 'provider') return Provider as Model<any>;
  return Customer as Model<any>;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;
    const { action, type } = await req.json();
    const Model = getModel(type);

    const update: Record<string, unknown> = {};
    if (action === 'approve')  update.isApproved  = true;
    else if (action === 'suspend') update.isSuspended = true;
    else if (action === 'restore') update.isSuspended = false;
    else return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    const user = await Model.findByIdAndUpdate(id, update, { new: true }).select('-password');
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json({ user });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (payload.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connectDB();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const Model = getModel(searchParams.get('type'));

    await Model.findByIdAndDelete(id);
    return NextResponse.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
