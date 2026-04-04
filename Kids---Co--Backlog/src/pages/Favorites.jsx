import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ProductGrid from '../components/product/ProductGrid';
import ProductQuickView from '../components/product/ProductQuickView';
import { fetchFavorites } from '../api/favorites';
import { normalizeProduct, fetchProductById } from '../api/products';

const Favorites = () => {
  const { favorites, user } = useApp();
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadFavoriteProducts = async () => {
      if (!user) {
        // For guests, fetch individual product details from backend if we have IDs
        if (favorites.length === 0) {
          setFavoriteProducts([]);
          return;
        }

        try {
          setIsLoading(true);
          const productPromises = favorites.map(id => fetchProductById(id));
          const results = await Promise.all(productPromises);
          const prods = results
            .filter(res => res.success && res.data)
            .map(res => res.data);
          setFavoriteProducts(prods);
        } catch (err) {
          console.error('Error loading guest favorites:', err);
          setFavoriteProducts([]);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        const res = await fetchFavorites();
        if (res.success && Array.isArray(res.data)) {
          // Normalize the product data from the favorite objects
          const prods = res.data.map(fav => normalizeProduct(fav.product));
          setFavoriteProducts(prods);
        }
      } catch (err) {
        console.error('Error loading full favorites info:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavoriteProducts();
  }, [favorites, user]);

  if (isLoading) return <div className="text-center py-20">Loading favorites...</div>;

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-20 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-gray-500">
        <Link to="/" className="hover:text-gray-900">Home</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900">Favorites</span>
      </nav>

      {favoriteProducts.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h2 className="text-2xl font-bold mb-2">No favorites yet</h2>
          <p className="text-gray-600 mb-6">Start adding products to your favorites!</p>
          <Link
            to="/shop"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-8 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">Favorites</h1>
          <ProductGrid
            products={favoriteProducts}
            onQuickView={(product) => setSelectedProduct(product)}
          />
        </>
      )}

      {/* Quick View Modal */}
      {selectedProduct && (
        <ProductQuickView
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default Favorites;

