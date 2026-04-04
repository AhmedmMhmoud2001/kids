import { useTheme } from '../../context/ThemeContext';

export const DashboardCard = ({ 
  children, 
  className = '',
  title,
  subtitle,
  icon: Icon,
  action,
  hoverable = false,
}) => {
  const { isDark } = useTheme();

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border
        transition-all duration-300
        ${isDark 
          ? 'bg-dark-card border-dark-border' 
          : 'bg-light-card border-light-border'
        }
        ${hoverable ? 'hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer' : ''}
        ${className}
      `}
    >
      {(title || subtitle || Icon || action) && (
        <div className="p-5 border-b border-inherit">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
            {Icon && (
              <div className={`
                p-2 rounded-lg
                ${isDark ? 'bg-dark-bg' : 'bg-light-bg'}
              `}>
                <Icon className="w-5 h-5 text-blue-500" />
              </div>
            )}
          </div>
          {action && (
            <div className="mt-3">
              {action}
            </div>
          )}
        </div>
      )}
      <div className="p-5">
        {children}
      </div>
    </div>
  );
};

export const StatCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon: Icon,
  trend,
}) => {
  const { isDark } = useTheme();

  const changeColors = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-500 dark:text-gray-400',
  };

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border p-5
        transition-all duration-300
        ${isDark 
          ? 'bg-dark-card border-dark-border' 
          : 'bg-light-card border-light-border'
        }
        hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {value}
          </p>
          {change && (
            <p className={`mt-1 text-sm font-medium ${changeColors[changeType]}`}>
              {changeType === 'positive' && '↑ '}
              {changeType === 'negative' && '↓ '}
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`
            p-3 rounded-xl
            ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}
          `}>
            <Icon className="w-6 h-6 text-blue-500" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div 
            className={`
              h-full rounded-full transition-all duration-500
              ${changeType === 'positive' ? 'bg-green-500' : 
                changeType === 'negative' ? 'bg-red-500' : 'bg-blue-500'}
            `}
            style={{ width: `${trend}%` }}
          />
        </div>
      )}
    </div>
  );
};

export const DashboardGrid = ({ children, columns = 3, gap = 6 }) => {
  const { isDark } = useTheme();
  
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`
      grid ${gridCols[columns] || gridCols[3]} gap-${gap}
      ${isDark ? 'bg-dark-bg' : 'bg-light-bg'}
    `}>
      {children}
    </div>
  );
};

export default DashboardCard;