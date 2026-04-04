/**
 * View mode selector component (3, 4, 5 columns)
 */
const ViewModeSelector = ({ viewMode, onChange }) => {
  const modes = [
    { value: 'grid-3', title: '3 columns' },
    { value: 'grid-4', title: '4 columns' },
    { value: 'grid-5', title: '5 columns' },
  ];

  return (
    <div className="flex items-center gap-1 border rounded p-1">
      {modes.map((mode) => (
        <button
          key={mode.value}
          onClick={() => onChange(mode.value)}
          className={`p-1.5 rounded transition-colors ${
            viewMode === mode.value 
              ? 'bg-blue-500 text-white' 
              : 'text-gray-400 hover:text-gray-600'
          }`}
          title={mode.title}
        >
          {mode.value === 'grid-3' && (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="2" width="6" height="6" rx="1" />
              <rect x="9" y="2" width="6" height="6" rx="1" />
              <rect x="16" y="2" width="6" height="6" rx="1" />
              <rect x="2" y="9" width="6" height="6" rx="1" />
              <rect x="9" y="9" width="6" height="6" rx="1" />
              <rect x="16" y="9" width="6" height="6" rx="1" />
            </svg>
          )}
          {mode.value === 'grid-4' && (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="2" y="2" width="4.5" height="4.5" rx="1" />
              <rect x="7.5" y="2" width="4.5" height="4.5" rx="1" />
              <rect x="13" y="2" width="4.5" height="4.5" rx="1" />
              <rect x="18.5" y="2" width="4.5" height="4.5" rx="1" />
              <rect x="2" y="7.5" width="4.5" height="4.5" rx="1" />
              <rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1" />
              <rect x="13" y="7.5" width="4.5" height="4.5" rx="1" />
              <rect x="18.5" y="7.5" width="4.5" height="4.5" rx="1" />
            </svg>
          )}
          {mode.value === 'grid-5' && (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="1" y="1" width="3.5" height="3.5" rx="0.5" />
              <rect x="5.5" y="1" width="3.5" height="3.5" rx="0.5" />
              <rect x="10" y="1" width="3.5" height="3.5" rx="0.5" />
              <rect x="14.5" y="1" width="3.5" height="3.5" rx="0.5" />
              <rect x="19" y="1" width="3.5" height="3.5" rx="0.5" />
              <rect x="1" y="5.5" width="3.5" height="3.5" rx="0.5" />
              <rect x="5.5" y="5.5" width="3.5" height="3.5" rx="0.5" />
              <rect x="10" y="5.5" width="3.5" height="3.5" rx="0.5" />
              <rect x="14.5" y="5.5" width="3.5" height="3.5" rx="0.5" />
              <rect x="19" y="5.5" width="3.5" height="3.5" rx="0.5" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
};

export default ViewModeSelector;

