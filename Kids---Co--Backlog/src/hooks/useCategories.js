import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { fetchCategories } from '../api/categories';

/**
 * Hook to fetch categories
 * @param {string} audience - 'KIDS' or 'NEXT' (optional)
 * @param {Object} options - React Query options
 */
export const useCategories = (audience = null, options = {}) => {
  return useQuery({
    queryKey: queryKeys.categories.list(audience),
    queryFn: () => fetchCategories(audience),
    select: (data) => data?.data || [],
    staleTime: 10 * 60 * 1000, // Categories don't change often
    ...options,
  });
};
