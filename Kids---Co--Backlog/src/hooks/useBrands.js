import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { fetchBrands } from '../api/brands';

/**
 * Hook to fetch brands
 * @param {string} audience - 'KIDS' or 'NEXT' (optional)
 * @param {Object} options - React Query options
 */
export const useBrands = (audience = null, options = {}) => {
  return useQuery({
    queryKey: queryKeys.brands.list(audience),
    queryFn: () => fetchBrands(audience),
    select: (data) => data?.data || [],
    staleTime: 10 * 60 * 1000, // Brands don't change often
    ...options,
  });
};
