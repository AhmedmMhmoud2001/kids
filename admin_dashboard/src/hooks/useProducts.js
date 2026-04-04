import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { 
  fetchProducts, 
  fetchProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../api/products';

/**
 * Hook to fetch all products
 */
export const useProducts = (audience = null, options = {}) => {
  return useQuery({
    queryKey: queryKeys.products.list(audience),
    queryFn: () => fetchProducts(audience),
    select: (data) => data?.data || [],
    ...options,
  });
};

/**
 * Hook to fetch a single product
 */
export const useProduct = (id, options = {}) => {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => fetchProduct(id),
    select: (data) => data?.data || null,
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook to create a product
 */
export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
};

/**
 * Hook to update a product
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
};

/**
 * Hook to delete a product
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
};
