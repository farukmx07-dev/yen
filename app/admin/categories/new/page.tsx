'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';
import { adminBtnPrimary, adminBtnSecondary, adminCard, adminInput, adminLabel } from '@/lib/adminUi';

export default function NewCategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    image: '',
  });

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: name
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/admin/categories');
      } else {
        alert('Hata: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Kategori oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <Link
        href="/admin/categories"
        className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
      >
        <FiArrowLeft size={16} />
        Geri
      </Link>

      <h1 className="text-xl font-bold text-white">Yeni Kategori Ekle</h1>

      <form onSubmit={handleSubmit} className={`${adminCard} space-y-5 p-6`}>
        <div>
          <label className={adminLabel}>Kategori Adı *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className={adminInput}
          />
        </div>

        <div>
          <label className={adminLabel}>Slug *</label>
          <input
            type="text"
            required
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className={adminInput}
          />
          <p className="mt-1 text-xs text-gray-500">URL için kullanılacak benzersiz tanımlayıcı</p>
        </div>

        <div>
          <label className={adminLabel}>Görsel URL</label>
          <input
            type="url"
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            className={adminInput}
          />
        </div>

        <div>
          <label className={adminLabel}>Açıklama</label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={adminInput}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/admin/categories" className={adminBtnSecondary}>
            İptal
          </Link>
          <button type="submit" disabled={loading} className={adminBtnPrimary}>
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </form>
    </div>
  );
}
