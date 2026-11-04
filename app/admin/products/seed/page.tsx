'use client';

import { useState } from 'react';
import Link from 'next/link';
import { adminBtnPrimary, adminBtnSecondary, adminCard } from '@/lib/adminUi';

export default function SeedProductsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    added?: number;
    skipped?: number;
    errors?: string[];
    error?: string;
  } | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/products/seed', {
        method: 'POST',
      });

      const data = await res.json();
      setResult(data);
    } catch (error: unknown) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Bir hata oluştu',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-white">Örnek Ürünler Ekle</h1>
        <Link href="/admin/products" className={adminBtnSecondary}>
          Geri Dön
        </Link>
      </div>

      <div className={`${adminCard} p-6`}>
        <p className="mb-6 text-sm text-gray-400">
          Bu işlem 10 adet örnek ürünü veritabanına ekleyecektir. Eğer aynı SKU&apos;ya sahip
          ürünler varsa, onlar atlanacaktır.
        </p>

        <button
          onClick={handleSeed}
          disabled={loading}
          className={`w-full ${adminBtnPrimary} py-3 font-bold disabled:cursor-not-allowed`}
        >
          {loading ? 'Ürünler ekleniyor...' : 'Örnek Ürünleri Ekle'}
        </button>

        {result && (
          <div
            className={`mt-6 rounded-lg border p-4 ${
              result.success
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : 'border-red-500/30 bg-red-500/10'
            }`}
          >
            {result.success ? (
              <div>
                <h3 className="mb-2 font-bold text-emerald-400">Başarılı</h3>
                <p className="text-emerald-300">{result.message}</p>
                {result.added !== undefined && result.added > 0 && (
                  <p className="mt-2 text-emerald-400">{result.added} ürün eklendi</p>
                )}
                {result.skipped !== undefined && result.skipped > 0 && (
                  <p className="text-emerald-400">{result.skipped} ürün atlandı (zaten mevcut)</p>
                )}
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="font-semibold text-red-400">Hatalar:</p>
                    <ul className="list-inside list-disc text-sm text-red-300">
                      {result.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="mb-2 font-bold text-red-400">Hata</h3>
                <p className="text-red-300">{result.error}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 rounded-lg border border-[#2a3142] bg-[#0f1117] p-4">
          <h3 className="mb-2 font-bold text-white">Eklenecek Ürünler:</h3>
          <ul className="list-inside list-disc space-y-1 text-sm text-gray-400">
            <li>Samsung Galaxy S23 Ultra 256GB</li>
            <li>Apple iPhone 15 Pro Max 256GB</li>
            <li>Xiaomi Redmi Note 13 Pro 128GB</li>
            <li>Adidas Ultraboost 23 Erkek Spor Ayakkabı</li>
            <li>Nike Air Max 270 Kadın Spor Ayakkabı</li>
            <li>Arzum Okka Kahve Makinesi</li>
            <li>Braun Multiquick 7 El Blender</li>
            <li>Dyson V15 Detect Kablosuz Süpürge</li>
            <li>Samsung 55&quot; QLED 4K Smart TV</li>
            <li>Apple MacBook Air M2 256GB</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
