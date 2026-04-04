import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query Keys
export const queryKeys = {
  // Dashboard
  dashboard: {
    stats: ['dashboard', 'stats'],
    reports: (params) => ['dashboard', 'reports', params],
  },
  // Orders
  orders: {
    all: ['orders'],
    list: (filters) => ['orders', 'list', filters],
    detail: (id) => ['orders', 'detail', id],
    kids: ['orders', 'kids'],
    next: ['orders', 'next'],
  },
  // Products
  products: {
    all: ['products'],
    list: (audience) => ['products', 'list', audience],
    detail: (id) => ['products', 'detail', id],
    kids: ['products', 'kids'],
    next: ['products', 'next'],
  },
  // Categories
  categories: {
    all: ['categories'],
    detail: (id) => ['categories', 'detail', id],
  },
  // Brands
  brands: {
    all: ['brands'],
    detail: (id) => ['brands', 'detail', id],
  },
  // Users
  users: {
    all: ['users'],
    detail: (id) => ['users', 'detail', id],
  },
  // Coupons
  coupons: {
    all: ['coupons'],
    detail: (id) => ['coupons', 'detail', id],
  },
  // Notifications
  notifications: {
    all: ['notifications'],
    unread: ['notifications', 'unread'],
  },
  // Contact
  contact: {
    all: ['contact'],
  },
  // Settings
  settings: {
    all: ['settings'],
  },
};
