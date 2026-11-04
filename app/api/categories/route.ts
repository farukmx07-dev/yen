import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { categoriesDb } from '@/lib/db';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET() {
  try {
    await connectDB();
    const categories = await categoriesDb.findAll();
    return NextResponse.json({ success: true, data: categories });
  } catch (error: any) {
    console.error('Kategoriler getirilirken hata:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    if (!body.slug && body.name) {
      body.slug = slugify(body.name);
    }

    const category = await categoriesDb.create(body);
    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error: any) {
    console.error('Kategori oluşturulurken hata:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
