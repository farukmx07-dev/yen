import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { productsDb } from '@/lib/db';

export async function GET() {
  try {
    await connectDB();
    const products = await productsDb.findAllPopulated();
    return NextResponse.json(
      { success: true, data: products },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          Pragma: 'no-cache',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const product = await productsDb.create(body);
    const populated = await productsDb.findByIdPopulated(product._id);
    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
