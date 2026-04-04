import ViewModeSelector from './ViewModeSelector';
import { getPriceRangeText } from '../../utils/productFilters';

/**
 * Product toolbar component with filters, view mode, and pagination controls
 */
const ProductToolbar = ({
  viewMode,
  onViewModeChange,
  showFilters,
  onToggleFilters,
  itemsPerPage,
  onItemsPerPageChange,
  filteredCount,
  totalCount,
  hasActiveFilters,
  onClearFilters,
  filters,
  onRemovePriceFilter,
  categoryName,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear filters
          </button>
        )}

        {/* Active Price Filter */}
        {filters?.priceRange && filters.priceRange !== 'all' && (
          <button
            onClick={onRemovePriceFilter}
            className="flex items-center gap-2 text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded-full hover:bg-blue-100 transition-colors"
          >
            <span>{getPriceRangeText(filters.priceRange)}</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Results count */}
        <span className="text-sm text-gray-600">
          {categoryName
            ? `${filteredCount} products in ${categoryName}`
            : `${filteredCount} products found`
          }
        </span>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {/* Items per page */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Show:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value={15}>15</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={45}>45</option>
          </select>
        </div>

        {/* View Mode Selector */}
        <ViewModeSelector viewMode={viewMode} onChange={onViewModeChange} />

        {/* Filter Toggle */}
        <button
          onClick={onToggleFilters}
          className={`flex items-center gap-2 px-4 py-2 border rounded transition-colors ${showFilters
              ? 'bg-blue-500 text-white border-blue-500'
              : 'border-gray-300 hover:bg-gray-50'
            }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter
        </button>
      </div>
    </div>
  );
};

export default ProductToolbar;

