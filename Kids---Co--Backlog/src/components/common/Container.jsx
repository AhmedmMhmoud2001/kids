/**
 * Container component for consistent spacing across the site
 * Provides unified padding: px-4 sm:px-6 md:px-10 lg:px-20
 */
const Container = ({ children, className = '', as: Component = 'div' }) => {
  return (
    <Component className={`container mx-auto px-4 sm:px-6 md:px-10 lg:px-20 max-w-full overflow-x-hidden ${className}`}>
      {children}
    </Component>
  );
};

export default Container;

