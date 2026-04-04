import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache data for 30 minutes
      gcTime: 30 * 60 * 1000,
      // Retry failed requests 2 times
      retry: 2,
      // Don't refetch on window focus in production
      refetchOnWindowFocus: import.meta.env.PROD ? false : true,
      // Don't refetch on reconnect automatically
      refetchOnReconnect: 'always',
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
    },
  },
});

// Query Keys - centralized for consistency
export const queryKeys = {
  // Products
  products: {
    all: ['products'],
    list: (filters) => ['products', 'list', filters],
    detail: (id) => ['products', 'detail', id],
    bestSellers: (audience) => ['products', 'bestSellers', audience],
    colors: ['products', 'colors'],
  },
  // Categories
  categories: {
    all: ['categories'],
    list: (audience) => ['categories', 'list', audience],
  },
  // Brands
  brands: {
    all: ['brands'],
    list: (audience) => ['brands', 'list', audience],
  },
  // Cart
  cart: {
    all: ['cart'],
    items: ['cart', 'items'],
  },
  // Favorites
  favorites: {
    all: ['favorites'],
    list: ['favorites', 'list'],
  },
  // Orders
  orders: {
    all: ['orders'],
    list: ['orders', 'list'],
    detail: (id) => ['orders', 'detail', id],
  },
  // User
  user: {
    profile: ['user', 'profile'],
  },
  // Settings
  settings: {
    all: ['settings'],
  },
};
