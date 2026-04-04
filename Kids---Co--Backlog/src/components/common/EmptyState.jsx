/**
 * Empty state component for when no items are found
 */
const EmptyState = ({ 
  icon, 
  title = 'No items found', 
  description = 'Try adjusting your filters',
  actionLabel = 'Clear filters',
  onAction 
}) => {
  return (
    <div className="text-center py-16">
      {icon || (
        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      <h3 className="text-xl font-semibold text-gray-700 mb-2">{title}</h3>
      {description && <p className="text-gray-500 mb-4">{description}</p>}
      {onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

