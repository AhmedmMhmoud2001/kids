import { Inbox } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon = Inbox,
  title = 'No data', 
  message = 'No items found',
  action,
  actionLabel,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-center mb-4 max-w-sm">{message}</p>
      {action && actionLabel && (
        <button
          onClick={action}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
