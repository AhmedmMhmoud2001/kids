import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import ProductCard from '../product/ProductCard';
import ProductQuickView from '../product/ProductQuickView';
import { useApp } from '../../context/AppContext';
import { fetchProducts } from '../../api/products';
import { Search, X, Loader2, ArrowRight, CornerDownLeft } from 'lucide-react';

const SearchModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { audience } = useApp();
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close modal when location changes
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname]);
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Fetch search results from backend
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setIsLoading(true);
        const res = await fetchProducts({
          search: searchQuery,
          audience: audience
        });

        if (res.success && Array.isArray(res.data)) {
          setSearchResults(res.data.slice(0, 8)); // Limit to 8 results
        }
      } catch (err) {
        console.error("Error fetching search results:", err);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // Debounce API calls

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, audience]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}&audience=${audience}`);
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Search Modal Overlay */}
      <div
        className="fixed inset-0 z-[100] flex items-start justify-center pt-2 md:pt-20 px-0 md:px-4"
        onKeyDown={handleKeyDown}
      >
        {/* Backdrop glassmorphism */}
        <div
          className="fixed inset-0 bg-white/80 backdrop-blur-xl animate-fade-in"
          onClick={onClose}
        />

        {/* Modal Container */}
        <div className="bg-white w-full max-w-4xl max-h-[100vh] md:max-h-[85vh] md:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden flex flex-col relative animate-slide-in-bottom">

          {/* Header Area */}
          <div className="p-6 md:p-8 border-b border-gray-100 bg-white/50 sticky top-0 z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">Search</span>
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Find something special</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-all group"
              >
                <X className="w-6 h-6 text-gray-400 group-hover:text-gray-900 group-hover:rotate-90 transition-all duration-300" />
              </button>
            </div>

            <form onSubmit={handleSearch} className="relative group">
              <div className="relative flex items-center">
                <Search className="absolute left-5 w-6 h-6 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search in ${audience === 'NEXT' ? 'NEXT' : 'KIDS'}...`}
                  className="w-full pl-16 pr-24 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-600 focus:bg-white rounded-2xl text-xl font-bold text-gray-900 placeholder-gray-300 outline-none transition-all"
                />

                <div className="absolute right-5 flex items-center gap-3">
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                  ) : searchQuery.trim() && (
                    <button
                      type="submit"
                      className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase transition-all shadow-lg shadow-blue-200 active:scale-95"
                    >
                      Search
                      <CornerDownLeft className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-hide">
            {!searchQuery.trim() ? (
              <div className="text-center py-20 animate-fade-in">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-gray-200" />
                </div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2">Start searching</h3>
                <p className="text-gray-400 max-w-xs mx-auto text-sm">
                  Type to search for products in {audience === 'NEXT' ? 'NEXT' : 'KIDS'}...
                </p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm font-bold text-gray-500 uppercase">
                    Displaying results for <span className="text-gray-900">"{searchQuery}"</span>
                  </p>
                  <Link
                    to={`/shop?search=${encodeURIComponent(searchQuery)}&audience=${audience}`}
                    onClick={onClose}
                    className="flex items-center gap-2 text-blue-600 text-xs font-black uppercase tracking-wider hover:underline"
                  >
                    View Collection
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {searchResults.map((product) => (
                    <div key={product.id} className="group cursor-pointer">
                      <ProductCard
                        product={product}
                        onQuickView={setSelectedProduct}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : !isLoading && (
              <div className="text-center py-20 animate-fade-in">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-gray-200" />
                </div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2">No matches found</h3>
                <p className="text-gray-400 max-w-xs mx-auto text-sm">
                  We couldn't find anything matching your search. Try checking your spelling or use more general terms.
                </p>
              </div>
            )}
          </div>

          {/* Footer Area */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Press <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded-md text-gray-900 shadow-sm mx-1">ESC</kbd> to close</p>
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {selectedProduct && (
        <ProductQuickView
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
};

export default SearchModal;


