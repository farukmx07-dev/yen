'use client';

import { useEffect, useState } from 'react';

export default function CartBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const total = cart.reduce((sum: number, item: any) => sum + item.quantity, 0);
      setCount(total);
    };

    updateCount();
    const interval = setInterval(updateCount, 1000);
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return (
    <span className="absolute -top-1 sm:-top-1.5 md:-top-2 -right-1 sm:-right-1.5 md:-right-2 bg-a101-red text-white text-[9px] sm:text-[10px] md:text-xs rounded-full h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 flex items-center justify-center font-bold">
      {count > 99 ? '99+' : count}
    </span>
  );
}


