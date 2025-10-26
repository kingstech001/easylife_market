// src/hooks/useFormatAmount.ts
import { useCallback } from 'react';

export const useFormatAmount = (currency: string = 'NGN') => {
  const formatAmount = useCallback((value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(value);
  }, [currency]);

  return { formatAmount };
};
