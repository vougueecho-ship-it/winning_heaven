import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    const BLOG_ADMIN_EMAIL = process.env.BLOG_ADMIN_EMAIL || 'blogadmin@winningheaven.com';
    const BLOG_ADMIN_PASSWORD = process.env.BLOG_ADMIN_PASSWORD || 'blog123';
    const MASTER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@winningheaven.com';
    const MASTER_ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

    const cleanEmail = String(email || '').toLowerCase().trim();
    const cleanPass = String(password || '').trim();

    const isBlogAdmin = cleanEmail === BLOG_ADMIN_EMAIL.toLowerCase() && cleanPass === BLOG_ADMIN_PASSWORD;
    const isMasterAdmin = cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase() && cleanPass === MASTER_ADMIN_PASSWORD;

    if (isBlogAdmin || isMasterAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Blog Admin authentication successful!',
        user: {
          email: cleanEmail,
          role: 'blog_admin',
          name: isMasterAdmin ? 'Master Admin' : 'Blog Editor',
          token: `blog_token_${Date.now()}`
        }
      });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid Blog Admin credentials.' },
      { status: 401 }
    );
  } catch (err) {
    console.error('Blog Admin login error:', err);
    return NextResponse.json(
      { success: false, message: 'Authentication failed due to server error.' },
      { status: 500 }
    );
  }
}
