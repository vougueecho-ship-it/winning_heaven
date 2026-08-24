import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/mongodb';
import { blogPosts as seedPosts } from '../../../lib/blogData';

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function ensureSeedBlogs(db) {
  const count = await db.collection('blogs').countDocuments();
  if (count === 0) {
    const formatted = seedPosts.map((post) => ({
      ...post,
      status: 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    await db.collection('blogs').insertMany(formatted);
    console.log('[Seed Database] Seeded initial blog posts into MongoDB Atlas.');
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');
    const includeDrafts = searchParams.get('admin') === 'true';

    const db = await getDb();
    await ensureSeedBlogs(db);

    if (slug) {
      const blog = await db.collection('blogs').findOne({ slug });
      if (!blog) {
        return NextResponse.json({ success: false, message: 'Article not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, blog });
    }

    if (id) {
      const blog = await db.collection('blogs').findOne({ id });
      if (!blog) {
        return NextResponse.json({ success: false, message: 'Article not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, blog });
    }

    const query = includeDrafts ? {} : { status: { $ne: 'draft' } };
    const blogs = await db.collection('blogs').find(query).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({ success: true, blogs });
  } catch (err) {
    console.error('GET /api/blogs error:', err);
    return NextResponse.json({ success: false, message: 'Failed to fetch blogs' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, summary, category, author, readTime, image, tags, content, status, featured } = body;

    if (!title || !content) {
      return NextResponse.json({ success: false, message: 'Title and content are required' }, { status: 400 });
    }

    const db = await getDb();
    await ensureSeedBlogs(db);

    const generatedSlug = slugify(title) || `article-${Date.now()}`;
    const newId = `blog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newBlog = {
      id: newId,
      slug: generatedSlug,
      title: title.trim(),
      summary: (summary || '').trim() || title.substring(0, 140),
      category: (category || 'Sweepstakes Games').trim(),
      author: (author || 'Winning Heaven Team').trim(),
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      readTime: (readTime || '5 min read').trim(),
      image: (image || '/winning_heaven_banner.png').trim(),
      tags: Array.isArray(tags) ? tags : (tags || '').split(',').map((t) => t.trim()).filter(Boolean),
      content,
      featured: Boolean(featured),
      status: status === 'draft' ? 'draft' : 'published',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.collection('blogs').insertOne(newBlog);

    return NextResponse.json({ success: true, message: 'Blog post created successfully!', blog: newBlog });
  } catch (err) {
    console.error('POST /api/blogs error:', err);
    return NextResponse.json({ success: false, message: 'Failed to create blog post' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, title, summary, category, author, readTime, image, tags, content, status, featured } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Blog ID is required' }, { status: 400 });
    }

    const db = await getDb();
    const updateData = {
      updatedAt: new Date().toISOString()
    };

    if (title !== undefined) {
      updateData.title = title.trim();
      updateData.slug = slugify(title);
    }
    if (summary !== undefined) updateData.summary = summary.trim();
    if (category !== undefined) updateData.category = category.trim();
    if (author !== undefined) updateData.author = author.trim();
    if (readTime !== undefined) updateData.readTime = readTime.trim();
    if (image !== undefined) updateData.image = image.trim();
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim()).filter(Boolean);
    }
    if (content !== undefined) updateData.content = content;
    if (featured !== undefined) updateData.featured = Boolean(featured);
    if (status !== undefined) updateData.status = status;

    const result = await db.collection('blogs').updateOne({ id }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: 'Blog post not found' }, { status: 404 });
    }

    const updatedBlog = await db.collection('blogs').findOne({ id });

    return NextResponse.json({ success: true, message: 'Blog post updated successfully!', blog: updatedBlog });
  } catch (err) {
    console.error('PUT /api/blogs error:', err);
    return NextResponse.json({ success: false, message: 'Failed to update blog post' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Blog ID is required' }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection('blogs').deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: 'Blog post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Blog post deleted successfully!' });
  } catch (err) {
    console.error('DELETE /api/blogs error:', err);
    return NextResponse.json({ success: false, message: 'Failed to delete blog post' }, { status: 500 });
  }
}
