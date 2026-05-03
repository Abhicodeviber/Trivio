import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { verifyToken } from '@/lib/auth';

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
const ALLOWED     = [...IMAGE_TYPES, ...VIDEO_TYPES];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

function safeFilename(original: string): string {
  const ext  = path.extname(original).toLowerCase();
  const base = path.basename(original, ext).replace(/[^a-z0-9_-]/gi, '_').slice(0, 60);
  return `${Date.now()}-${base}${ext}`;
}

export async function POST(req: NextRequest) {
  try {
    // Auth: must be admin or vendor
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!['admin', 'vendor', 'provider'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file || !file.name) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate type
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({
        error: `Unsupported file type: ${file.type}. Allowed: images (jpg, png, webp, gif) and videos (mp4, webm).`
      }, { status: 400 });
    }

    // Validate size
    const isVideo  = VIDEO_TYPES.includes(file.type);
    const maxBytes = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxBytes) {
      return NextResponse.json({
        error: `File too large. Max size: ${isVideo ? '100 MB' : '10 MB'}.`
      }, { status: 400 });
    }

    // Save to public/uploads/
    const filename   = safeFilename(file.name);
    const uploadDir  = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(path.join(uploadDir, filename), buffer);

    return NextResponse.json({
      url:      `/uploads/${filename}`,
      filename,
      type:     isVideo ? 'video' : 'image',
      size:     file.size,
    }, { status: 201 });
  } catch (err) {
    console.error('[upload]', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
