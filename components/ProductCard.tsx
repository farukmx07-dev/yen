'use client';

import Link from 'next/link';
import { FiHeart, FiShoppingCart } from 'react-icons/fi';
import { useState } from 'react';
import ProductImage from '@/components/ProductImage';
import AddToCartModal, { type AddToCartModalProduct } from '@/components/AddToCartModal';
import { trackTikTok } from '@/lib/tiktokPixel';
import { useStoreTheme } from '@/components/StoreThemeProvider';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    discount?: number;
    stock: number;
  };
  imagePriority?: boolean;
}

export default function ProductCard({ product, imagePriority = true }: ProductCardProps) {
  const { storeMode, copy } = useStoreTheme();
  const isCarrefour = storeMode === 'carrefoursa';
  const isSok = storeMode === 'sokmarket';
  const isBim = storeMode === 'bim';
  const isStoreBrand = isCarrefour || isSok || isBim;
  const [isFavorite, setIsFavorite] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartModalProduct, setCartModalProduct] = useState<AddToCartModalProduct | null>(null);
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : product.discount || 0;

  const productHref = `/products/${product._id}`;

  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.productId === product._id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));

    trackTikTok('AddToCart', {
      contents: [
        {
          content_id: product._id,
          content_name: product.name,
          content_type: 'product',
          quantity: existingItem ? existingItem.quantity : 1,
          price: product.price,
        },
      ],
      value: product.price,
      currency: 'TRY',
    });

    setCartModalProduct({
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: existingItem ? existingItem.quantity : 1,
    });
    setShowCartModal(true);

    window.dispatchEvent(new Event('cartUpdated'));
  };

  return (
    <>
      <article
        className={`product-card-shell min-w-0 ${
          isStoreBrand
            ? `rounded-lg border shadow-sm ${isBim ? 'border-[#ED1C24]/40' : 'border-gray-200'}`
            : 'rounded-xl border border-gray-100 shadow-lg sm:rounded-2xl'
        }`}
      >
        <div className="product-card-media">
          <Link href={productHref} className="absolute inset-0 z-[1]" aria-label={product.name} />

          <div className="product-card-media-inner">
            <ProductImage src={product.image} alt={product.name} priority={imagePriority} />
          </div>

          {copy.productBadge && (
            <div className="product-card-overlay left-2 top-2 max-w-[calc(100%-3rem)] rounded-md border border-yellow-600/30 bg-yellow-400 px-2 py-0.5 text-[10px] font-black leading-tight text-gray-900 sm:text-xs">
              {copy.productBadge}
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className="product-card-action right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm sm:right-2 sm:top-2 sm:h-10 sm:w-10"
            aria-label={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          >
            <FiHeart size={16} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'} />
          </button>

          {discountPercent > 0 && (
            <div className="product-card-overlay bottom-2 left-2 rounded-md bg-a101-red px-1.5 py-0.5 text-[10px] font-black text-white">
              %{discountPercent}
            </div>
          )}

          {product.stock > 0 && product.stock < 10 && (
            <div className="product-card-overlay bottom-2 right-2 rounded-md bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              Son {product.stock}
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-2.5 sm:p-3">
          {copy.installmentBadge && (
            <span className="mb-1.5 inline-block w-fit rounded-md bg-a101-red px-1.5 py-0.5 text-[9px] font-black text-white sm:text-[10px]">
              {copy.installmentBadge}
            </span>
          )}

          <Link href={productHref} className="mb-2 block min-w-0">
            <h3
              className={`line-clamp-2 font-bold leading-snug text-gray-900 ${
                isStoreBrand ? 'text-xs sm:text-sm' : 'text-[11px] sm:text-xs md:text-sm'
              }`}
            >
              {product.name}
            </h3>
          </Link>

          <div className="mb-2 min-w-0">
            <p
              className={`font-black leading-none ${
                isCarrefour
                  ? 'text-base text-[#004E97] sm:text-lg'
                  : isBim
                    ? 'text-base text-[#ED1C24] sm:text-lg'
                    : 'text-base text-gray-900 sm:text-lg'
              }`}
            >
              {product.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}₺
            </p>
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="mt-1 text-[10px] text-gray-500 line-through sm:text-xs">
                ₺{product.originalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            )}
          </div>

          {product.stock > 0 ? (
            <button
              type="button"
              onClick={handleAddToCart}
              className={`mt-auto flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-black text-white sm:min-h-[40px] sm:text-xs ${
                isCarrefour || isSok
                  ? 'bg-[#FFD100] text-[#004E97]'
                  : isBim
                    ? 'bg-[#ED1C24]'
                    : 'bg-a101-lightBlue'
              }`}
            >
              <FiShoppingCart size={14} />
              <span>Sepete Ekle</span>
            </button>
          ) : (
            <div className="mt-auto flex min-h-[36px] items-center justify-center rounded-lg bg-gray-300 text-[10px] font-bold text-gray-700 sm:min-h-[40px] sm:text-xs">
              Stokta Yok
            </div>
          )}
        </div>
      </article>

      <AddToCartModal
        isOpen={showCartModal}
        product={cartModalProduct}
        onClose={() => setShowCartModal(false)}
      />
    </>
  );
}
