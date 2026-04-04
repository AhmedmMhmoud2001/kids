const PageContainer = ({ 
  children, 
  className = '',
  title,
  subtitle,
  maxWidth = 'max-w-7xl',
  padding = true,
}) => {
  return (
    <div className={`${maxWidth} mx-auto w-full ${padding ? 'px-4 sm:px-6 md:px-8 lg:px-10 py-6' : ''}`}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className={className}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer;