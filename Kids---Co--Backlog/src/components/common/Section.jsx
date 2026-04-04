/**
 * Section component for consistent section spacing
 */
const Section = ({ 
  children, 
  className = '', 
  padding = 'py-6 sm:py-8 lg:py-12',
  container = true 
}) => {
  const content = container ? (
    <div className={`${padding} px-4 sm:px-6 md:px-10 lg:px-20 ${className}`}>
      {children}
    </div>
  ) : (
    <section className={`${padding} ${className}`}>
      {children}
    </section>
  );

  return content;
};

export default Section;

