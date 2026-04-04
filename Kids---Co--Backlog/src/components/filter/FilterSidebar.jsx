import { useMemo, useState, useEffect } from 'react';

const FilterSidebar = ({ onFilterChange, filters = {}, audience }) => {
  // Use properties directly from props to avoid sync loops
  const {
    sortBy = 'popularity',
    priceRange = 'all',
    selectedColors = [],
    selectedBrands = [],
  } = filters;

  const [availableBrands, setAvailableBrands] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        // Load Brands
        const { fetchBrands } = await import('../../api/brands');
        const brandsData = await fetchBrands();
        const brandsList = Array.isArray(brandsData) ? brandsData : (brandsData.data || []);
        setAvailableBrands(brandsList);

        // Load Colors
        const { fetchColors } = await import('../../api/products');
        const colorsData = await fetchColors();
        const colorsList = Array.isArray(colorsData) ? colorsData : (colorsData.data || []);
        setAvailableColors(colorsList);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };
    loadFilters();
  }, []);

  const handleSortByChange = (value) => {
    onFilterChange({ ...filters, sortBy: value });
  };

  const handlePriceRangeChange = (value) => {
    onFilterChange({ ...filters, priceRange: value });
  };

  const toggleColor = (colorName) => {
    const newColors = selectedColors.includes(colorName)
      ? selectedColors.filter(c => c !== colorName)
      : [...selectedColors, colorName];
    onFilterChange({ ...filters, selectedColors: newColors });
  };

  const toggleBrand = (brandName) => {
    const newBrands = selectedBrands.includes(brandName)
      ? selectedBrands.filter(b => b !== brandName)
      : [...selectedBrands, brandName];
    onFilterChange({ ...filters, selectedBrands: newBrands });
  };

  const sortOptions = [
    { value: 'popularity', label: 'Popularity' },
    { value: 'rating', label: 'Average rating' },
    { value: 'newness', label: 'Newness' },
    { value: 'price-low', label: 'Price low to high' },
    { value: 'price-high', label: 'Price high to low' },
  ];

  const priceRanges = [
    { value: 'all', label: 'All' },
    { value: '0-1200', label: '0.00 EGP - 1,200 EGP' },
    { value: '1200-2400', label: '1,200 EGP - 2,400 EGP' },
    { value: '2400-3600', label: '2,400 EGP - 3,600 EGP' },
    { value: '3600+', label: '3,600 EGP +' },
  ];

  return (
    <div className="w-full space-y-8">
      {/* Sort By */}
      <div>
        <h3 className="font-semibold mb-4">Sort by</h3>
        <div className="flex flex-wrap gap-2">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSortByChange(option.value)}
              className={`px-4 py-2 border rounded transition-colors ${sortBy === option.value
                ? 'border-blue-500 bg-blue-50 text-blue-600'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <hr />

      {/* Price */}
      <div>
        <h3 className="font-semibold mb-4">Price</h3>
        <div className="flex flex-wrap gap-2">
          {priceRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => handlePriceRangeChange(range.value)}
              className={`px-4 py-2 border rounded transition-colors ${priceRange === range.value
                ? 'border-blue-500 bg-blue-50 text-blue-600'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <hr />

      {/* Color */}
      <div>
        <h3 className="font-semibold mb-4">Color</h3>
        <div className="flex flex-wrap gap-2">
          {availableColors.length === 0 ? (
            <p className="text-sm text-gray-500">No colors available</p>
          ) : (
            availableColors.map((colorName) => (
              <button
                key={colorName}
                onClick={() => toggleColor(colorName)}
                className={`px-3 py-2 border rounded flex items-center gap-2 transition-colors ${selectedColors.includes(colorName)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
                  }`}
              >
                <div
                  className="w-4 h-4 rounded-full border shadow-sm"
                  style={{ backgroundColor: colorName.toLowerCase().replace(' ', '') }}
                />
                <span className="text-sm">
                  {colorName}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      <hr />

      {/* Brands - Hide for NEXT audience */}
      {audience !== 'NEXT' && (
        <div>
          <h3 className="font-semibold mb-4">Brands</h3>
          <div className="space-y-2">
            {availableBrands.length === 0 ? (
              <p className="text-sm text-gray-500">Loading brands...</p>
            ) : (
              availableBrands.map((brand) => (
                <label
                  key={brand.id || brand.name}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand.name)}
                    onChange={() => toggleBrand(brand.name)}
                    className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">
                    {brand.name}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSidebar;
