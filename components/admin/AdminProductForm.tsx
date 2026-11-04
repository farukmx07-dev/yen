'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FiArrowLeft, FiStar, FiX, FiPlus } from 'react-icons/fi';
import { PRODUCT_PLACEHOLDER } from '@/lib/publicAssets';

export interface ProductFormData {
  name: string;
  description: string;
  price: string;
  images: string[];
  category: string;
  stock: string;
  sku: string;
  featured: boolean;
  brand: string;
}

interface Category {
  _id: string;
  name: string;
}

interface AdminProductFormProps {
  title: string;
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
  categories: Category[];
  loading: boolean;
  submitLabel: string;
  loadingLabel: string;
  onSubmit: (e: React.FormEvent) => void;
}

const inputClass =
  'w-full rounded-lg border border-[#2a3142] bg-[#0f1117] px-4 py-2.5 text-sm text-white placeholder:text-gray-600 focus:border-blue-500 focus:outline-none';
const labelClass = 'mb-2 block text-xs font-medium text-gray-400';
const subLabelClass = 'mb-1 block text-[11px] text-gray-500';

export default function AdminProductForm({
  title,
  formData,
  setFormData,
  categories,
  loading,
  submitLabel,
  loadingLabel,
  onSubmit,
}: AdminProductFormProps) {
  const [imageUrlInput, setImageUrlInput] = useState('');

  const readFile = (file: File) =>
    new Promise<string>((resolve, reject) => {
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error("Dosya boyutu 5MB'dan küçük olmalıdır"));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Dosya okunamadı'));
      reader.readAsDataURL(file);
    });

  const handleFilesChange = async (files: FileList | null) => {
    if (!files?.length) return;

    try {
      const results = await Promise.all(Array.from(files).map(readFile));
      setFormData((prev) => ({ ...prev, images: [...prev.images, ...results] }));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Görsel yüklenemedi');
    }
  };

  const addImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    setFormData((prev) => ({ ...prev, images: [...prev.images, url] }));
    setImageUrlInput('');
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const setPrimaryImage = (index: number) => {
    if (index === 0) return;
    setFormData((prev) => {
      const next = [...prev.images];
      const [selected] = next.splice(index, 1);
      next.unshift(selected);
      return { ...prev, images: next };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.images.length === 0) {
      alert('En az bir ürün görseli ekleyin');
      return;
    }
    onSubmit(e);
  };

  return (
    <div className="space-y-5">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
      >
        <FiArrowLeft size={16} />
        Ürünlere dön
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {formData.featured && (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
            <FiStar size={12} />
            Kampanyalı ürün
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-[#2a3142] bg-[#151922] p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>Ürün Adı *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
              placeholder="Ürün adını girin"
            />
          </div>

          <div>
            <label className={labelClass}>SKU *</label>
            <input
              type="text"
              required
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className={inputClass}
              placeholder="Stok kodu"
            />
          </div>

          <div>
            <label className={labelClass}>Kategori *</label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={inputClass}
            >
              <option value="">Seçiniz</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Marka</label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Örn: Apple, Samsung..."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Fiyat (₺) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className={inputClass}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className={labelClass}>Stok *</label>
            <input
              type="number"
              required
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className={inputClass}
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Açıklama *</label>
          <textarea
            required
            rows={5}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className={`${inputClass} resize-y min-h-[120px]`}
            placeholder="Ürün özellikleri ve açıklaması"
          />
        </div>

        <div className="rounded-xl border border-[#2a3142] bg-[#0f1117] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <label className={labelClass}>Görseller *</label>
            <span className="text-xs text-gray-500">{formData.images.length} görsel</span>
          </div>

          <div className="space-y-4">
            <div>
              <span className={subLabelClass}>Dosya yükle (birden fazla seçebilirsiniz)</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  void handleFilesChange(e.target.files);
                  e.target.value = '';
                }}
                className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-blue-500`}
              />
            </div>

            <div>
              <span className={subLabelClass}>Veya URL / dosya yolu ekle</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addImageUrl();
                    }
                  }}
                  placeholder="/products/urun.jpg veya https://..."
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={addImageUrl}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
                >
                  <FiPlus size={14} />
                  Ekle
                </button>
              </div>
            </div>

            {formData.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {formData.images.map((src, index) => (
                  <div
                    key={`${src.slice(0, 32)}-${index}`}
                    className="relative overflow-hidden rounded-lg border border-[#2a3142] bg-[#151922] p-2"
                  >
                    {index === 0 && (
                      <span className="absolute left-2 top-2 z-10 rounded bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-[#0f1117]">
                        Ana
                      </span>
                    )}
                    <div className="flex h-28 items-center justify-center sm:h-32">
                      <img
                        src={src}
                        alt={`Görsel ${index + 1}`}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = PRODUCT_PLACEHOLDER;
                        }}
                      />
                    </div>
                    <div className="mt-2 flex gap-1">
                      {index !== 0 && (
                        <button
                          type="button"
                          onClick={() => setPrimaryImage(index)}
                          className="flex-1 rounded border border-[#2a3142] px-2 py-1 text-[10px] font-semibold text-gray-300 hover:border-amber-500/40 hover:text-amber-400"
                        >
                          Ana yap
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="inline-flex items-center justify-center rounded border border-red-500/30 bg-red-500/10 px-2 py-1 text-red-400 hover:bg-red-500/20"
                        aria-label="Görseli sil"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#2a3142] px-4 py-8 text-center text-sm text-gray-500">
                Henüz görsel eklenmedi
              </div>
            )}
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#2a3142] bg-[#0f1117] px-4 py-3">
          <input
            type="checkbox"
            checked={formData.featured}
            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
            className="h-4 w-4 rounded border-[#2a3142] bg-[#151922] text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
          />
          <div>
            <span className="block text-sm font-medium text-white">Kampanyalı ürün</span>
            <span className="block text-xs text-gray-500">Ana sayfada kampanya bölümünde gösterilir</span>
          </div>
        </label>

        <div className="flex flex-wrap justify-end gap-3 border-t border-[#2a3142] pt-5">
          <Link
            href="/admin/products"
            className="rounded-lg border border-[#2a3142] px-5 py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
          >
            İptal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? loadingLabel : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
