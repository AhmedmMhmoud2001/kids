import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryClient';
import { 
  fetchOrders, 
  fetchOrderById, 
  updateOrderStatus, 
  updateOrderDetails,
  updateOrderItems,
  deleteOrder 
} from '../api/orders';

/**
 * Hook to fetch all orders with optional filters
 */
export const useOrders = (filters = {}, options = {}) => {
  const audience = filters?.audience;
  const audienceParam = typeof audience === 'string' ? audience : null;
  return useQuery({
    queryKey: queryKeys.orders.list(filters),
    queryFn: () => fetchOrders(audienceParam),
    select: (data) => data?.data || [],
    ...options,
  });
};

/**
 * Hook to fetch orders by audience
 */
export const useOrdersByAudience = (audience, options = {}) => {
  return useQuery({
    queryKey: audience === 'KIDS' ? queryKeys.orders.kids : queryKeys.orders.next,
    queryFn: () => fetchOrders(audience),
    select: (data) => data?.data || [],
    ...options,
  });
};

/**
 * Hook to fetch a single order
 */
export const useOrder = (id, options = {}) => {
  return useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => fetchOrderById(id),
    select: (data) => data?.data || null,
    enabled: !!id,
    ...options,
  });
};

/**
 * Hook to update order status
 */
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
};

/**
 * Hook to update order details
 */
export const useUpdateOrderDetails = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => updateOrderDetails(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
};

/**
 * Hook to update order items
 */
export const useUpdateOrderItems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, items }) => updateOrderItems(id, items),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
};

/**
 * Hook to delete an order
 */
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
};
