import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { productsDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { id, direction, orderedIds } = body as {
      id?: string;
      direction?: 'up' | 'down';
      orderedIds?: string[];
    };

    if (Array.isArray(orderedIds) && orderedIds.length > 0) {
      const products = await productsDb.setOrder(orderedIds);
      return NextResponse.json({ success: true, data: products });
    }

    if (!id || (direction !== 'up' && direction !== 'down')) {
      return NextResponse.json(
        { success: false, error: 'Geçersiz sıralama isteği' },
        { status: 400 }
      );
    }

    const products = await productsDb.reorder(id, direction);
    return NextResponse.json({ success: true, data: products });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Sıralama güncellenemedi';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
