import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Customer from '@/models/Customer';
import Provider from '@/models/Provider';
import Vendor from '@/models/Vendor';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, password, role, phone, location, skills,
            shopName, ownerName, city, whatsapp, description } = body;

    const errors: Record<string, string> = {};
    if (!email?.trim())  errors.email    = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Invalid email address';
    if (!password)       errors.password = 'Password is required';
    else if (password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (!['customer', 'provider', 'vendor'].includes(role)) errors.role = 'Invalid role';

    if (role === 'customer' || role === 'provider') {
      if (!name?.trim()) errors.name = 'Name is required';
    }
    if (role === 'provider') {
      if (!phone?.trim())    errors.phone    = 'Phone number is required';
      if (!location?.trim()) errors.location = 'Location is required';
    }
    if (role === 'vendor') {
      if (!shopName?.trim())  errors.shopName  = 'Shop name is required';
      if (!ownerName?.trim()) errors.ownerName = 'Owner name is required';
      if (!phone?.trim())     errors.phone     = 'Phone number is required';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ error: Object.values(errors)[0], errors }, { status: 400 });
    }

    // Duplicate check across all collections
    const [existingC, existingP, existingV] = await Promise.all([
      Customer.findOne({ email: email.toLowerCase() }),
      Provider.findOne({ email: email.toLowerCase() }),
      Vendor.findOne({ email: email.toLowerCase() }),
    ]);
    if (existingC) return NextResponse.json({ error: 'This email is already registered as a Customer. Please use a different email.' }, { status: 409 });
    if (existingP) return NextResponse.json({ error: 'This email is already registered as a Provider. Please use a different email.' }, { status: 409 });
    if (existingV) return NextResponse.json({ error: 'This email is already registered as a Vendor. Please use a different email.' }, { status: 409 });

    let doc;
    let finalRole: string;

    if (role === 'vendor') {
      doc = await Vendor.create({
        shopName:    shopName.trim(),
        ownerName:   ownerName.trim(),
        email:       email.toLowerCase().trim(),
        password,
        phone:       phone.trim(),
        whatsapp:    whatsapp?.trim() ?? '',
        city:        city?.trim() ?? '',
        description: description?.trim() ?? '',
      });
      finalRole = 'vendor';
    } else if (role === 'provider') {
      doc = await Provider.create({
        name:     name.trim(),
        email:    email.toLowerCase().trim(),
        password,
        phone:    phone?.trim(),
        location: location?.trim(),
        skills:   Array.isArray(skills) ? skills : [],
      });
      finalRole = 'provider';
    } else {
      doc = await Customer.create({
        name:  name.trim(),
        email: email.toLowerCase().trim(),
        password,
      });
      finalRole = 'customer';
    }

    const token = signToken({
      userId: String(doc._id),
      role:   finalRole as 'customer' | 'provider' | 'admin' | 'vendor',
      email:  doc.email,
    });

    const res = NextResponse.json({ user: { ...doc.toJSON(), role: finalRole }, token }, { status: 201 });
    res.cookies.set('token', token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    });
    return res;
  } catch (err) {
    console.error('[signup]', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
