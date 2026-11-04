'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import Link from 'next/link';
import { useMemo } from 'react';
import { useStoreTheme } from '@/components/StoreThemeProvider';

interface Banner {
  id: string;
  image: string;
  title?: string;
  subtitle?: string;
  link?: string;
}

interface BannerSliderProps {
  banners?: Banner[];
}

const defaultBanners: Banner[] = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=1200&h=400&fit=crop',
    title: 'Eylül Fırsatları',
    subtitle: 'Tüm ürünlerde %50\'ye varan indirimler!',
    link: '/products',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop',
    title: 'Yeni Ürünler',
    subtitle: 'Son çıkan ürünleri keşfedin',
    link: '/products?new=true',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=1200&h=400&fit=crop',
    title: 'Kampanyalar',
    subtitle: 'Özel fırsatları kaçırmayın',
    link: '/products',
  },
];

export default function BannerSlider({ banners }: BannerSliderProps) {
  const { copy } = useStoreTheme();
  const slides = useMemo(() => {
    const base = banners ?? defaultBanners;
    return base.map((banner, index) =>
      index === 0 ? { ...banner, title: copy.bannerSlideTitle } : banner
    );
  }, [banners, copy.bannerSlideTitle]);

  return (
    <div className="relative w-full mb-6 min-w-0 overflow-hidden">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={0}
        slidesPerView={1}
        navigation
        pagination={{ 
          clickable: true
        }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        loop={true}
        className="rounded-xl overflow-hidden shadow-lg"
      >
        {slides.map((banner) => (
          <SwiperSlide key={banner.id}>
            <Link href={banner.link || '#'} className="block relative">
              <div className="relative w-full h-[clamp(12.5rem,35vw,28.125rem)] overflow-hidden">
                <img
                  src={banner.image}
                  alt={banner.title || 'Banner'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {(banner.title || banner.subtitle) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent flex items-center">
                    <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
                      <div className="max-w-2xl">
                        {banner.title && (
                          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-black text-white mb-1.5 sm:mb-2 md:mb-3 lg:mb-4 drop-shadow-lg leading-tight">
                            {banner.title}
                          </h2>
                        )}
                        {banner.subtitle && (
                          <p className="text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg 2xl:text-xl text-white/90 font-semibold drop-shadow-md leading-[1.3]">
                            {banner.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

