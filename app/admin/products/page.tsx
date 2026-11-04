'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSearch,
  FiDownload,
  FiCheckSquare,
  FiSquare,
  FiMove,
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { PRODUCT_PLACEHOLDER } from '@/lib/publicAssets';

interface Product {
  _id: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  category: { _id?: string; name: string };
  featured: boolean;
  brand?: string;
  sortOrder?: number;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const router = useRouter();

  const canDragSort = searchTerm === '' && categoryFilter === 'all';

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const persistOrder = async (ordered: Product[]) => {
    setSavingOrder(true);
    try {
      const res = await fetch('/api/products/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: ordered.map((p) => p._id) }),
      });
      const data = await res.json();
      if (!data.success) {
        await fetchProducts();
      }
    } catch (error) {
      console.error('Error saving product order:', error);
      await fetchProducts();
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDragStart = (event: React.DragEvent<HTMLSpanElement>, id: string) => {
    if (!canDragSort || savingOrder) {
      event.preventDefault();
      return;
    }
    setDraggedId(id);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (event: React.DragEvent<HTMLTableRowElement>, id: string) => {
    if (!canDragSort || !draggedId || draggedId === id) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverId(id);
  };

  const handleDrop = async (event: React.DragEvent<HTMLTableRowElement>, targetId: string) => {
    event.preventDefault();
    setDragOverId(null);

    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const fromIndex = products.findIndex((p) => p._id === draggedId);
    const toIndex = products.findIndex((p) => p._id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDraggedId(null);
      return;
    }

    const next = [...products];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);

    setProducts(next);
    setDraggedId(null);
    await persistOrder(next);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverId(null);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category?._id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p._id));
    }
  };

  const handleSelectProduct = (id: string) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter((pid) => pid !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (!confirm(`${selectedProducts.length} ürünü silmek istediğinize emin misiniz?`)) return;

    try {
      await Promise.all(
        selectedProducts.map((id) => fetch(`/api/products/${id}`, { method: 'DELETE' }))
      );
      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting products:', error);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Ürün Adı', 'Fiyat', 'Marka', 'Stok', 'Kategori', 'Öne Çıkan'].join(','),
      ...filteredProducts.map((p) =>
        [
          `"${p.name}"`,
          p.price,
          p.brand || '',
          p.stock,
          `"${p.category?.name || ''}"`,
          p.featured ? 'Evet' : 'Hayır',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `urunler_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const categories = Array.from(
    new Set(products.map((p) => p.category?._id).filter(Boolean))
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
        <div>
          <h1 className="text-xl font-bold text-white">Ürünler</h1>
          {canDragSort ? (
            <p className="mt-1 text-sm text-gray-500">
              Sıralamak için satırı tutup sürükleyin{savingOrder ? ' — kaydediliyor...' : ''}
            </p>
          ) : (
            <p className="mt-1 text-sm text-amber-400/90">
              Sürükleyerek sıralamak için arama ve kategori filtresini temizleyin
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedProducts.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400"
            >
              <FiTrash2 size={14} />
              Sil ({selectedProducts.length})
            </button>
          )}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400"
          >
            <FiDownload size={14} />
            Dışa Aktar
          </button>
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500"
          >
            <FiPlus size={14} />
            Yeni Ürün
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-[#2a3142] bg-[#151922] p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Ürün ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#2a3142] bg-[#0f1117] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-[#2a3142] bg-[#0f1117] px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Tüm Kategoriler</option>
            {categories.map((catId) => {
              const category = products.find((p) => p.category?._id === catId)?.category;
              return (
                <option key={catId} value={catId}>
                  {category?.name || 'Bilinmeyen'}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#2a3142] bg-[#151922]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-[#2a3142] text-left text-[10px] uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">
                  <button onClick={handleSelectAll}>
                    {selectedProducts.length === filteredProducts.length && filteredProducts.length > 0 ? (
                      <FiCheckSquare className="text-blue-400" size={18} />
                    ) : (
                      <FiSquare className="text-gray-600" size={18} />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 w-12">Sıra</th>
                <th className="px-4 py-3">Görsel</th>
                <th className="px-4 py-3">Ürün Adı</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Fiyat</th>
                <th className="px-4 py-3">Stok</th>
                <th className="px-4 py-3">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => {
                const globalIndex = products.findIndex((p) => p._id === product._id);
                const isDragging = draggedId === product._id;
                const isDragOver = dragOverId === product._id;

                return (
                  <tr
                    key={product._id}
                    onDragOver={(e) => handleDragOver(e, product._id)}
                    onDrop={(e) => handleDrop(e, product._id)}
                    onDragLeave={() => {
                      if (dragOverId === product._id) setDragOverId(null);
                    }}
                    className={`border-b border-[#2a3142]/60 transition-colors ${
                      isDragging ? 'opacity-40' : 'hover:bg-[#1a1f2b]'
                    } ${isDragOver ? 'bg-blue-500/10 ring-1 ring-inset ring-blue-500/40' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <button onClick={() => handleSelectProduct(product._id)}>
                        {selectedProducts.includes(product._id) ? (
                          <FiCheckSquare className="text-blue-400" size={18} />
                        ) : (
                          <FiSquare className="text-gray-600" size={18} />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          draggable={canDragSort && !savingOrder}
                          onDragStart={(e) => handleDragStart(e, product._id)}
                          onDragEnd={handleDragEnd}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                            canDragSort
                              ? 'cursor-grab border-[#2a3142] bg-[#0f1117] text-gray-400 active:cursor-grabbing hover:border-blue-500/40 hover:text-blue-400'
                              : 'cursor-not-allowed border-transparent text-gray-600 opacity-50'
                          }`}
                          title={canDragSort ? 'Tutup sürükleyin' : 'Sıralama için filtreyi temizleyin'}
                        >
                          <FiMove size={14} />
                        </span>
                        <span className="text-sm font-semibold text-gray-400">{globalIndex + 1}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <img
                        src={product.image || PRODUCT_PLACEHOLDER}
                        alt={product.name}
                        className="h-14 w-14 rounded-lg bg-[#0f1117] object-contain p-1 pointer-events-none"
                        draggable={false}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{product.name}</div>
                      {product.featured && (
                        <span className="text-xs font-semibold text-amber-400">Kampanyalı</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400">{product.category?.name || '-'}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-400">
                      ₺{product.price.toLocaleString('tr-TR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={product.stock < 10 ? 'text-red-400' : 'text-emerald-400'}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/admin/products/${product._id}`)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <FiEdit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-500">Ürün bulunamadı</div>
        )}
      </div>
    </div>
  );
}
