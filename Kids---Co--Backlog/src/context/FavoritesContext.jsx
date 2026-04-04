import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as favoritesApi from '../api/favorites';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
};

// Helper function to get storage key for user-specific data
const getStorageKey = (key, userId) => {
  return userId ? `${key}_${userId}` : `${key}_guest`;
};

export const FavoritesProvider = ({ children }) => {
  const { user } = useAuth();
  const abortControllerRef = useRef(null);

  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load favorites from backend or localStorage
  const loadFavorites = useCallback(async (signal) => {
    if (!user) {
      try {
        const savedFavorites = localStorage.getItem(getStorageKey('favorites', 'guest'));
        setFavorites(savedFavorites ? JSON.parse(savedFavorites) : []);
      } catch {
        setFavorites([]);
      }
      return;
    }

    try {
      setIsLoading(true);
      const res = await favoritesApi.fetchFavorites();
      
      // Check if request was aborted
      if (signal?.aborted) return;

      if (res.success && Array.isArray(res.data)) {
        const ids = res.data.map(fav => fav.productId);
        setFavorites(ids);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error loading favorites from backend:', err);
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [user]);

  // Sync favorites on user change with AbortController
  useEffect(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const syncFavorites = async () => {
      if (user) {
        // User logged in - merge guest favorites
        const guestFavorites = localStorage.getItem(getStorageKey('favorites', 'guest'));

        // Load user's favorites first
        await loadFavorites(controller.signal);

        // Merge guest favorites
        if (guestFavorites && !controller.signal.aborted) {
          try {
            const guestFavs = JSON.parse(guestFavorites);
            for (const productId of guestFavs) {
              if (controller.signal.aborted) break;
              try {
                await favoritesApi.addToFavorites(productId);
              } catch (err) {
                console.error('Error merging guest favorite:', err);
              }
            }
            // Clear guest favorites after merging
            localStorage.removeItem(getStorageKey('favorites', 'guest'));
            // Reload favorites to get updated data
            if (!controller.signal.aborted) {
              await loadFavorites(controller.signal);
            }
          } catch (err) {
            console.error('Error parsing guest favorites:', err);
          }
        }
      } else {
        // User logged out - load guest data
        loadFavorites(controller.signal);
      }
    };

    syncFavorites();

    // Cleanup function
    return () => {
      controller.abort();
    };
  }, [user, loadFavorites]);

  const toggleFavorite = useCallback(async (productId) => {
    // If not logged in, use local storage
    if (!user) {
      setFavorites((prev) => {
        const isFav = prev.includes(productId);
        const newFavs = isFav
          ? prev.filter((id) => id !== productId)
          : [...prev, productId];
        localStorage.setItem(getStorageKey('favorites', 'guest'), JSON.stringify(newFavs));
        return newFavs;
      });
      return;
    }

    // If logged in, sync with backend
    const isFav = favorites.includes(productId);
    
    // Optimistic update
    setFavorites(prev => 
      isFav 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );

    try {
      if (isFav) {
        await favoritesApi.removeFromFavorites(productId);
      } else {
        await favoritesApi.addToFavorites(productId);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      // Revert on error
      setFavorites(prev => 
        isFav 
          ? [...prev, productId]
          : prev.filter(id => id !== productId)
      );
      throw err;
    }
  }, [user, favorites]);

  const isFavorite = useCallback((productId) => {
    return favorites.includes(productId);
  }, [favorites]);

  const favoritesCount = favorites.length;

  const value = {
    favorites,
    toggleFavorite,
    isFavorite,
    favoritesCount,
    isLoading,
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};
