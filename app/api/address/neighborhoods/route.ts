import { NextRequest, NextResponse } from 'next/server';

const TURKIYE_API_URL = 'https://api.turkiyeapi.dev/v1';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const districtId = searchParams.get('districtId');

  if (!districtId) {
    return NextResponse.json(
      { success: false, error: 'districtId parametresi gerekli' },
      { status: 400 }
    );
  }

  try {
    // TurkiyeAPI'den mahalleleri çek
    const response = await fetch(
      `${TURKIYE_API_URL}/neighborhoods?districtId=${districtId}&fields=id,name&sort=name&limit=100`
    );
    
    if (!response.ok) {
      throw new Error('TurkiyeAPI hatası');
    }
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.data) {
      // API formatını bizim formatımıza çevir
      const neighborhoods = data.data.map((neighborhood: any) => ({
        id: neighborhood.id,
        name: neighborhood.name,
      }));
      
      return NextResponse.json({ success: true, data: neighborhoods });
    }
    
    throw new Error('Geçersiz API yanıtı');
  } catch (error: any) {
    console.error('Mahalle getirme hatası:', error);
    
    // Fallback: Eğer API çalışmazsa, genel mahalleler döndür
    const districtIdNum = parseInt(districtId);
    return NextResponse.json({
      success: true,
      data: [
        { id: districtIdNum * 100 + 1, name: 'Merkez Mahalle' },
        { id: districtIdNum * 100 + 2, name: 'Yeni Mahalle' },
        { id: districtIdNum * 100 + 3, name: 'Cumhuriyet Mahallesi' },
        { id: districtIdNum * 100 + 4, name: 'Atatürk Mahallesi' },
        { id: districtIdNum * 100 + 5, name: 'İstiklal Mahallesi' },
        { id: districtIdNum * 100 + 6, name: 'Fatih Mahallesi' },
      ],
    });
  }
}
