import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { queryKeys } from '../lib/queryClient';
import { fetchSystemStats } from '../api/dashboard';
import { fetchOrders } from '../api/orders';
import { fetchProducts } from '../api/products';
import { fetchCategories } from '../api/categories';
import { fetchUsers } from '../api/users';
import brandsApi from '../api/brands';
import couponsApi from '../api/coupons';

/**
 * Hook to fetch all dashboard data
 */
export const useDashboardData = () => {
  // System stats
  const statsQuery = useQuery({
    queryKey: queryKeys.dashboard.stats,
    queryFn: fetchSystemStats,
    select: (data) => data?.stats || {},
  });

  // Orders for chart (call fetchOrders with no args so React Query doesn't pass context as audience)
  const ordersQuery = useQuery({
    queryKey: queryKeys.orders.all,
    queryFn: () => fetchOrders(),
    select: (data) => data?.data || [],
  });

  // Products (list + total from pagination for dashboard count)
  const productsQuery = useQuery({
    queryKey: queryKeys.products.all,
    queryFn: () => fetchProducts(),
    select: (data) => ({
      list: data?.data || [],
      total: data?.pagination?.total ?? (data?.data?.length ?? 0),
    }),
  });

  // Categories count
  const categoriesQuery = useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: () => fetchCategories(),
    select: (data) => {
      // Handle different response formats
      if (Array.isArray(data)) return data;
      if (data?.data && Array.isArray(data.data)) return data.data;
      return [];
    },
  });

  // Brands count
  const brandsQuery = useQuery({
    queryKey: queryKeys.brands.all,
    queryFn: brandsApi.getAll,
    select: (data) => Array.isArray(data) ? data : (data?.data || []),
  });

  // Coupons count
  const couponsQuery = useQuery({
    queryKey: queryKeys.coupons.all,
    queryFn: couponsApi.getAll,
    select: (data) => data?.data || [],
  });

  // Users
  const usersQuery = useQuery({
    queryKey: queryKeys.users.all,
    queryFn: fetchUsers,
    select: (data) => data?.data || [],
  });

  const isLoading = 
    statsQuery.isLoading || 
    ordersQuery.isLoading || 
    productsQuery.isLoading;

  const isRefetching = 
    statsQuery.isRefetching || 
    ordersQuery.isRefetching || 
    productsQuery.isRefetching ||
    categoriesQuery.isRefetching ||
    brandsQuery.isRefetching ||
    couponsQuery.isRefetching ||
    usersQuery.isRefetching;

  const isError = 
    statsQuery.isError || 
    ordersQuery.isError || 
    productsQuery.isError ||
    categoriesQuery.isError;

  const refetchAll = useCallback(async () => {
    await Promise.all([
      statsQuery.refetch(),
      ordersQuery.refetch(),
      productsQuery.refetch(),
      categoriesQuery.refetch(),
      brandsQuery.refetch(),
      couponsQuery.refetch(),
      usersQuery.refetch(),
    ]);
  }, [statsQuery, ordersQuery, productsQuery, categoriesQuery, brandsQuery, couponsQuery, usersQuery]);

  return {
    stats: statsQuery.data,
    orders: ordersQuery.data,
    products: productsQuery.data,
    categories: categoriesQuery.data,
    brands: brandsQuery.data,
    coupons: couponsQuery.data,
    users: usersQuery.data,
    isLoading,
    isRefetching,
    isError,
    errors: {
      stats: statsQuery.error,
      orders: ordersQuery.error,
      products: productsQuery.error,
      categories: categoriesQuery.error,
      brands: brandsQuery.error,
      coupons: couponsQuery.error,
      users: usersQuery.error,
    },
    refetchAll,
  };
};
