import ProductCard from './ProductCard';

const ProductGrid = ({ products, viewMode = 'grid-4', onQuickView }) => {
  // Determine grid classes based on view mode
  const getGridClass = () => {
    switch (viewMode) {
      case 'grid-3':
        return 'grid-cols-2 md:grid-cols-3 gap-6';
      case 'grid-4':
        return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6';
      case 'grid-5':
        return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4';
      default:
        return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6';
    }
  };

  return (
    <div className={`grid ${getGridClass()}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
      ))}
    </div>
  );
};

export default ProductGrid;

