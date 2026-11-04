'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheck, FiX } from 'react-icons/fi';
import ProductImage from '@/components/ProductImage';

export interface AddToCartModalProduct {
  name: string;
  price: number;
  image: string;
  quantity?: number;
}

interface AddToCartModalProps {
  isOpen: boolean;
  product: AddToCartModalProduct | null;
  onClose: () => void;
}

export default function AddToCartModal({ isOpen, product, onClose }: AddToCartModalProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const lineTotal = product.price * (product.quantity ?? 1);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-to-cart-title"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#12151c] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          aria-label="Kapat"
        >
          <FiX size={18} />
        </button>

        <div className="px-6 pb-6 pt-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 shadow-[0_0_24px_rgba(37,99,235,0.45)]">
            <FiCheck size={32} className="text-white" strokeWidth={3} />
          </div>

          <h2
            id="add-to-cart-title"
            className="mb-6 text-lg font-black uppercase tracking-wide text-blue-400 sm:text-xl"
          >
            Sepete Eklendi!
          </h2>

          <div className="mx-auto mb-4 max-w-[220px] overflow-hidden rounded-xl bg-[#1a1f2b] p-4">
            <ProductImage
              src={product.image}
              alt={product.name}
              className="mx-auto max-h-36 w-full object-contain"
            />
          </div>

          <p className="mb-3 line-clamp-3 text-sm font-medium leading-snug text-white sm:text-base">
            {product.name}
          </p>

          <p className="mb-8 text-2xl font-black text-red-500">
            ₺{lineTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/25 bg-transparent px-4 py-3.5 text-sm font-bold text-white transition hover:bg-white/10"
            >
              Devam Et
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push('/cart');
              }}
              className="rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500"
            >
              Sepete Git
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
