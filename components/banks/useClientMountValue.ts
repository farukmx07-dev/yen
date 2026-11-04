'use client';

import { useEffect, useState } from 'react';

export function useClientMountValue<T>(factory: () => T, placeholder: T): T {
  const [value, setValue] = useState(placeholder);

  useEffect(() => {
    setValue(factory());
  }, []);

  return value;
}
