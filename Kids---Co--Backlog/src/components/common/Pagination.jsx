/**
 * Pagination component
 */
const Pagination = ({ currentPage = 1, totalPages = 1, onPageChange, className = '' }) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className={`flex items-center justify-center gap-2 mt-12 ${className}`}>
      <button
        onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        ‹
      </button>
      
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange?.(page)}
          className={`px-3 py-1 rounded transition-colors ${
            currentPage === page
              ? 'bg-blue-500 text-white'
              : 'border hover:bg-gray-50'
          }`}
          aria-label={`Page ${page}`}
        >
          {page}
        </button>
      ))}
      
      <button
        onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        ›
      </button>
    </div>
  );
};

export default Pagination;

