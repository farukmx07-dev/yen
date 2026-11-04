import { NextRequest, NextResponse } from 'next/server';

const TURKIYE_API_URL = 'https://api.turkiyeapi.dev/v1';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cityId = searchParams.get('cityId');

  if (!cityId) {
    return NextResponse.json(
      { success: false, error: 'cityId parametresi gerekli' },
      { status: 400 }
    );
  }

  try {
    // TurkiyeAPI'den ilçeleri çek
    const response = await fetch(
      `${TURKIYE_API_URL}/districts?provinceId=${cityId}&fields=id,name&sort=name`
    );
    
    if (!response.ok) {
      throw new Error('TurkiyeAPI hatası');
    }
    
    const data = await response.json();
    
    if (data.status === 'OK' && data.data) {
      // API formatını bizim formatımıza çevir
      const districts = data.data.map((district: any) => ({
        id: district.id,
        name: district.name,
      }));
      
      return NextResponse.json({ success: true, data: districts });
    }
    
    throw new Error('Geçersiz API yanıtı');
  } catch (error: any) {
    console.error('İlçe getirme hatası:', error);
    
    // Fallback: Eğer API çalışmazsa, genel ilçeler döndür
    const cityIdNum = parseInt(cityId);
    return NextResponse.json({
      success: true,
      data: [
        { id: cityIdNum * 100 + 1, name: 'Merkez' },
        { id: cityIdNum * 100 + 2, name: 'Merkez İlçe' },
      ],
    });
  }
}
