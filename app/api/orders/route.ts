import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ordersDb } from '@/lib/db';

export async function GET() {
  try {
    await connectDB();
    const orders = await ordersDb.findAllPopulated();
    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const order = await ordersDb.create(body);
    const populated = await ordersDb.findByIdPopulated(order._id);
    return NextResponse.json({ success: true, data: populated }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
