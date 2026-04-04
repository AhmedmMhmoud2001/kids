import LoadingSpinner from './LoadingSpinner';

const PageLoader = () => {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner size="lg" text="Loading page..." />
    </div>
  );
};

export default PageLoader;
