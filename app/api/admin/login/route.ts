import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { adminsDb } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  let username: string | undefined;
  let password: string | undefined;

  try {
    await connectDB();

    const body = await request.json();
    username = body.username;
    password = body.password;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı adı ve şifre gerekli' },
        { status: 400 }
      );
    }

    let admin = await adminsDb.findByUsername(username);

    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı adı veya şifre hatalı' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı adı veya şifre hatalı' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error: any) {
    console.error('Admin giriş hatası:', error);

    if (username && password) {
      const admin = await adminsDb.findByUsername(username);
      if (admin) {
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        if (isPasswordValid) {
          return NextResponse.json({
            success: true,
            user: {
              id: admin._id,
              username: admin.username,
              name: admin.name,
              email: admin.email,
              role: admin.role,
            },
          });
        }
      }
    }

    return NextResponse.json(
      { success: false, error: error.message || 'Giriş yapılamadı' },
      { status: 500 }
    );
  }
}
