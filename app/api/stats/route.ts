import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { getStats } from '@/lib/db';

export async function GET() {
  try {
    await connectDB();
    const data = await getStats();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
