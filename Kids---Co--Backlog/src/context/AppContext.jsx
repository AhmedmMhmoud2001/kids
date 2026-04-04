import { createContext, useContext, useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { CartProvider, useCart } from './CartContext';
import { FavoritesProvider, useFavorites } from './FavoritesContext';

// App-specific context for audience and other app-wide settings
const defaultAppContext = {
  audience: 'KIDS',
  setAudience: () => {},
};
const AppContext = createContext(defaultAppContext);

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return context;
};

const AppContextProvider = ({ children }) => {
  const [audience, setAudience] = useState('KIDS');

  const value = {
    audience,
    setAudience,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Combined hook that provides all context values (backward compatible)
export const useApp = () => {
  const appContext = useAppContext();
  const auth = useAuth();
  const cart = useCart();
  const favorites = useFavorites();

  return {
    // App settings
    audience: appContext.audience,
    setAudience: appContext.setAudience,
    
    // Auth
    user: auth.user,
    login: auth.login,
    logout: auth.logout,
    isAuthenticated: auth.isAuthenticated,
    
    // Cart
    cartItems: cart.cartItems,
    addToCart: cart.addToCart,
    removeFromCart: cart.removeFromCart,
    updateCartQuantity: cart.updateCartQuantity,
    clearCart: cart.clearCart,
    cartCount: cart.cartCount,
    cartTotal: cart.cartTotal,
    isCartOpen: cart.isCartOpen,
    setIsCartOpen: cart.setIsCartOpen,
    appliedCoupon: cart.appliedCoupon,
    setAppliedCoupon: cart.setAppliedCoupon,
    removeCoupon: cart.removeCoupon,
    
    // Favorites
    favorites: favorites.favorites,
    toggleFavorite: favorites.toggleFavorite,
    isFavorite: favorites.isFavorite,
    favoritesCount: favorites.favoritesCount,
  };
};

// Combined provider that wraps all contexts
export const AppProvider = ({ children }) => {
  return (
    <AuthProvider>
      <AppContextProvider>
        <CartProvider>
          <FavoritesProvider>
            {children}
          </FavoritesProvider>
        </CartProvider>
      </AppContextProvider>
    </AuthProvider>
  );
};

// Export individual hooks for direct access
export { useAuth } from './AuthContext';
export { useCart } from './CartContext';
export { useFavorites } from './FavoritesContext';
