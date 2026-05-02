import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Customer from '@/models/Customer';
import Provider from '@/models/Provider';
import User from '@/models/User';
import Vendor from '@/models/Vendor';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Search all collections in parallel
    const [customer, provider, admin, vendor] = await Promise.all([
      Customer.findOne({ email }).select('+password'),
      Provider.findOne({ email }).select('+password'),
      User.findOne({ email }).select('+password'),
      Vendor.findOne({ email }).select('+password'),
    ]);

    // Determine which account matched and its role
    let account;
    let role: 'customer' | 'provider' | 'admin' | 'vendor';

    if (customer)      { account = customer; role = 'customer'; }
    else if (provider) { account = provider; role = 'provider'; }
    else if (vendor)   { account = vendor;   role = 'vendor'; }
    else if (admin)    { account = admin;    role = 'admin'; }
    else {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await account.comparePassword(password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if ('isSuspended' in account && account.isSuspended) {
      return NextResponse.json({ error: 'Account has been suspended' }, { status: 403 });
    }

    if ('isActive' in account && account.isActive === false) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    const token = signToken({ userId: String(account._id), role, email: account.email });
    const safeUser = { ...account.toJSON(), role };

    const res = NextResponse.json({ user: safeUser, token });
    res.cookies.set('token', token, { httpOnly: true, maxAge: 60 * 60 * 24 * 7, path: '/', sameSite: 'lax' });
    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
