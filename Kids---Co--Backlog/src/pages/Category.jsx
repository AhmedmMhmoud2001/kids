import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import Container from '../components/common/Container';
import Breadcrumb from '../components/common/Breadcrumb';
import ProductGrid from '../components/product/ProductGrid';
import ProductToolbar from '../components/product/ProductToolbar';
import FilterSidebarWrapper from '../components/filter/FilterSidebarWrapper';
import ProductQuickView from '../components/product/ProductQuickView';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import { applyFilters, explodeProductsByColor } from '../utils/productFilters';
import { fetchProducts } from '../api/products';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

const Category = () => {
  const { category } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryAudience = searchParams.get('audience');
  const offerBrandSlug = searchParams.get('brandSlug');
  const offerProductIdsRaw = searchParams.get('productIds');
  const { audience: contextAudience, setAudience } = useApp();
  const { t } = useLanguage();

  // URL param takes priority over context
  const audience = queryAudience || contextAudience;

  // Sync URL audience with context (only when needed)
  useEffect(() => {
    if (queryAudience && queryAudience !== contextAudience) {
      setAudience(queryAudience);
    }
  }, [queryAudience]); // Only depend on queryAudience to avoid infinite loop

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid-4');
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filters, setFilters] = useState({
    sortBy: 'popularity',
    priceRange: 'all',
    selectedColors: [],
    selectedBrands: [],
  });

  // Reset page, filters and scroll to top on category/audience change
  useEffect(() => {
    setCurrentPage(1);
    setProducts([]); // Clear current products to avoid showing stale data while loading
    setFilters({
      sortBy: 'popularity',
      priceRange: 'all',
      selectedColors: [],
      selectedBrands: [],
    });
    setShowFilters(false);
    window.scrollTo(0, 0);
  }, [category, queryAudience]); // Use queryAudience instead of audience

  useEffect(() => {
    const loadProducts = async () => {
      // Only load if we have both category and audience
      if (!category || !audience) return;

      try {
        setIsLoading(true);
        const res = await fetchProducts({
          category,
          audience,
          ...(offerBrandSlug ? { brands: [offerBrandSlug] } : {})
        });
        setProducts(res.data || []);
      } catch (err) {
        console.error("Error fetching category products:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProducts();
  }, [category, queryAudience, contextAudience, offerBrandSlug]); // Depend on both URL and context audience

  // Prefer backend localized category name if available
  const fallbackCategoryName =
    category
      ?.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Category';
  const categoryName = t(products?.[0]?.categoryName || fallbackCategoryName);

  // Filter products by category and apply filters
  const offerProductIds = useMemo(
    () => new Set(
      String(offerProductIdsRaw || '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    ),
    [offerProductIdsRaw]
  );

  // Show one card per colour (e.g. 3-colour product → 3 cards) before filtering/paging.
  const explodedProducts = useMemo(() => explodeProductsByColor(products), [products]);

  const filteredProducts = useMemo(() => {
    const byFilters = applyFilters(explodedProducts, filters, category);
    if (!offerProductIds.size) return byFilters;
    return byFilters.filter((p) => offerProductIds.has(String(p.id)));
  }, [explodedProducts, category, filters, offerProductIds]);

  // Paginate products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const clearFilters = () => {
    setFilters({
      sortBy: 'popularity',
      priceRange: 'all',
      selectedColors: [],
      selectedBrands: [],
    });
    setCurrentPage(1);
  };

  const hasActiveFilters =
    filters.priceRange !== 'all' ||
    filters.selectedColors.length > 0 ||
    filters.selectedBrands.length > 0;

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleRemovePriceFilter = () => {
    setFilters({ ...filters, priceRange: 'all' });
    setCurrentPage(1);
  };

  return (
    <div className=" container mx-auto px-4 sm:px-6 md:px-10 lg:px-16">
      <div className="py-8 ">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: audience === 'NEXT' ? 'Home 2' : 'Home', to: audience === 'NEXT' ? '/home2' : '/' },
            { label: categoryName },
          ]}
        />

        {/* Toolbar */}
        <ProductToolbar
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          filteredCount={filteredProducts.length}
          totalCount={explodedProducts.length}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          filters={filters}
          onRemovePriceFilter={handleRemovePriceFilter}
          categoryName={categoryName}
        />

        {/* Main Content */}
        <div className="relative">
          {/* Products Grid */}
          <div className={showFilters ? 'lg:mr-80' : ''}>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : paginatedProducts.length > 0 ? (
              <>
                <ProductGrid
                  key={`${category}-${audience}`} // Force re-render on category or audience change
                  products={paginatedProducts}
                  viewMode={viewMode}
                  onQuickView={setSelectedProduct}
                />

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            ) : (
              <EmptyState
                title="No products found"
                description="Try adjusting your filters"
                actionLabel="Clear filters"
                onAction={clearFilters}
              />
            )}
          </div>

          {/* Filter Sidebar */}
          <FilterSidebarWrapper
            isOpen={showFilters}
            onClose={() => {
              setShowFilters(false);
              clearFilters();
            }}
            onFilterChange={handleFilterChange}
            filters={filters}
            audience={audience}
          />
        </div>

        {/* Quick View Modal */}
        {selectedProduct && (
          <ProductQuickView
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </div>
    </div>

  );
};

export default Category;
