'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { adminBtnPrimary, adminCard, adminInput } from '@/lib/adminUi';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchCategories();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-white">Kategoriler</h1>
        <Link href="/admin/categories/new" className={`flex items-center gap-2 ${adminBtnPrimary}`}>
          <FiPlus size={14} />
          Yeni Kategori
        </Link>
      </div>

      <div className={`${adminCard} p-4`}>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Kategori ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${adminInput} pl-10`}
          />
        </div>
      </div>

      <div className={`${adminCard} overflow-hidden`}>
        <div className="table-responsive -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full">
            <thead className="border-b border-[#2a3142] bg-[#0f1117]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Görsel
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Kategori Adı
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Açıklama
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2a3142]">
              {filteredCategories.map((category) => (
                <tr key={category._id} className="transition-colors hover:bg-[#1a1f2b]">
                  <td className="whitespace-nowrap px-4 py-4">
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="h-16 w-16 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded bg-[#0f1117]">
                        <span className="text-xs text-gray-600">Görsel Yok</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-white">{category.name}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-400">
                    {category.slug}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-400">
                    {category.description || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/admin/categories/${category._id}`)}
                        className="text-blue-400 transition-colors hover:text-blue-300"
                      >
                        <FiEdit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(category._id)}
                        className="text-red-400 transition-colors hover:text-red-300"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredCategories.length === 0 && (
          <div className="py-12 text-center text-gray-500">Kategori bulunamadı</div>
        )}
      </div>
    </div>
  );
}
