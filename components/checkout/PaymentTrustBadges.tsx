export default function PaymentTrustBadges() {
  const badges = [
    { id: 'troy', label: 'troy', className: 'text-cyan-500 font-bold italic' },
    { id: 'amex', label: 'AMEX', className: 'text-[#006fcf] font-black text-[9px] leading-none' },
    { id: 'visa', label: 'VISA', className: 'text-[#1a1f71] font-black italic text-sm' },
    { id: 'mc', circles: true },
    { id: '3d', label: '3D SECURE', shield: true },
    { id: 'secure', label: 'GÜVENLİ ÖDE', secure: true },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 px-2 py-3">
      {badges.map((badge) => {
        if (badge.circles) {
          return (
            <div key={badge.id} className="flex items-center">
              <span className="h-4 w-4 rounded-full bg-[#eb001b]" />
              <span className="-ml-2 h-4 w-4 rounded-full bg-[#f79e1b]" />
            </div>
          );
        }
        if (badge.shield) {
          return (
            <div key={badge.id} className="flex flex-col items-center leading-none">
              <div className="flex h-6 w-5 items-center justify-center rounded border border-gray-400 bg-white text-[8px] font-black">
                3D
              </div>
              <span className="mt-0.5 text-[7px] font-bold text-gray-600">SECURE</span>
            </div>
          );
        }
        if (badge.secure) {
          return (
            <div
              key={badge.id}
              className="flex items-center gap-1 rounded-full bg-[#00a19a] px-2 py-1 text-[8px] font-bold text-white"
            >
              <span className="rounded-full border border-white px-1">GO</span>
              GÜVENLİ ÖDE
            </div>
          );
        }
        return (
          <span key={badge.id} className={badge.className}>
            {badge.label}
          </span>
        );
      })}
    </div>
  );
}
