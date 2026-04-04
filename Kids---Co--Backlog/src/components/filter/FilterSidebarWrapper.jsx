import FilterSidebar from './FilterSidebar';

/**
 * Filter sidebar wrapper with overlay and close button
 */
const FilterSidebarWrapper = ({ isOpen, onClose, onFilterChange, filters, audience }) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Filter Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 lg:z-40 transform transition-transform duration-300 ease-in-out overflow-y-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        <div className="p-6">
          {/* Close Button */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Filter</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close filter"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <FilterSidebar onFilterChange={onFilterChange} filters={filters} audience={audience} />
        </div>
      </div>
    </>
  );
};

export default FilterSidebarWrapper;

