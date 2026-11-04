import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

export async function GET() {
  let database: 'mysql' | 'mysql-unavailable' = 'mysql';
  let dbError: string | undefined;

  try {
    await connectDB();
  } catch (error: unknown) {
    database = 'mysql-unavailable';
    dbError = error instanceof Error ? error.message : 'Database unavailable';
  }

  return NextResponse.json(
    {
      status: database === 'mysql' ? 'ok' : 'degraded',
      database,
      dbError,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'production',
    },
    { status: 200 }
  );
}
