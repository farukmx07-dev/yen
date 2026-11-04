import Link from 'next/link';

const SOK_BRANDS = [
  { id: 'win', label: 'win', className: 'text-[#E30613] font-black italic tracking-tight text-lg' },
  { id: 'mis', label: 'MİS', className: 'text-[#0047AB] font-black tracking-tight text-base' },
  { id: 'piyale', label: 'Piyale', className: 'text-[#C4000F] font-serif font-bold italic text-base' },
  { id: 'amigo', label: 'AMİGO', className: 'text-[#0047AB] font-black tracking-wide text-sm' },
  { id: 'evin', label: 'Evin', className: 'text-[#2E7D32] font-bold text-base' },
  { id: 'lio', label: 'Lio', className: 'text-[#1B5E20] font-black text-lg' },
  { id: 'mintax', label: 'Mintax', className: 'text-[#E30613] font-black text-sm' },
] as const;

export default function SokBrandGrid() {
  return (
    <div className="grid min-w-0 grid-cols-4 gap-2 xs:grid-cols-5 sm:grid-cols-7 sm:gap-2.5">
      {SOK_BRANDS.map((brand) => (
        <Link
          key={brand.id}
          href="/products"
          className="flex aspect-square min-w-0 touch-manipulation items-center justify-center rounded-lg border border-gray-200 bg-white p-1.5 shadow-sm transition-shadow hover:shadow-md sm:p-2"
          aria-label={`${brand.label} ürünleri`}
        >
          <span className={`block max-w-full truncate text-center leading-none ${brand.className}`}>
            {brand.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
