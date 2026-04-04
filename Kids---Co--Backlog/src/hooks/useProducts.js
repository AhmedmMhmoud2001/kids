import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { fetchProducts, fetchProductById, fetchBestSellers, fetchColors } from '../api/products';

/**
 * Hook to fetch products with optional filters
 * @param {Object} filters - Filter options (audience, category, search, etc.)
 * @param {Object} options - React Query options
 */
export const useProducts = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: () => fetchProducts(filters),
    select: (data) => data?.data || [],
    ...options,
  });
};

/**
 * Hook to fetch a single product by ID
 * @param {string|number} id - Product ID
 * @param {Object} options - React Query options
 */
export const useProduct = (id, options = {}) => {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => fetchProductById(id),
    select: (data) => data?.data || null,
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook to fetch best seller products
 * @param {string} audience - 'KIDS' or 'NEXT'
 * @param {Object} options - React Query options
 */
export const useBestSellers = (audience = null, options = {}) => {
  return useQuery({
    queryKey: queryKeys.products.bestSellers(audience),
    queryFn: () => fetchBestSellers(audience),
    select: (data) => data?.data || [],
    ...options,
  });
};

/**
 * Hook to fetch available colors
 * @param {Object} options - React Query options
 */
export const useColors = (options = {}) => {
  return useQuery({
    queryKey: queryKeys.products.colors,
    queryFn: fetchColors,
    select: (data) => data?.data || [],
    staleTime: 10 * 60 * 1000, // Colors don't change often
    ...options,
  });
};

/**
 * Hook to prefetch a product (useful for hover states)
 */
export const usePrefetchProduct = () => {
  const queryClient = useQueryClient();

  return (id) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.products.detail(id),
      queryFn: () => fetchProductById(id),
      staleTime: 5 * 60 * 1000,
    });
  };
};

/**
 * Hook to invalidate products cache
 */
export const useInvalidateProducts = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
    invalidateList: () => queryClient.invalidateQueries({ queryKey: ['products', 'list'] }),
    invalidateProduct: (id) => queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(id) }),
  };
};
