import FilterSidebar from './FilterSidebar';

const MobileFilterModal = ({ isOpen, onClose, onFilterChange }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl shadow-xl z-50 lg:hidden max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold">Filters</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4">
          <FilterSidebar onFilterChange={onFilterChange} />
        </div>

        {/* Apply Button */}
        <div className="sticky bottom-0 bg-white border-t p-4">
          <button
            onClick={onClose}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileFilterModal;

