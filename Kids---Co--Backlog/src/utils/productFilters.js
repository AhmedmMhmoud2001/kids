/**
 * Utility functions for product filtering and sorting
 */

/**
 * Filter products by price range
 */
export const filterByPriceRange = (products, priceRange) => {
  if (priceRange === 'all') return products;

  return products.filter(product => {
    let price = 0;
    if (typeof product.price === 'number') {
      price = product.price;
    } else if (typeof product.price === 'string') {
      price = parseFloat(product.price.replace(/[^0-9.]/g, ''));
    } else if (product.price && product.price.$numberDecimal) {
      price = parseFloat(product.price.$numberDecimal);
    } else {
      price = parseFloat(String(product.price).replace(/[^0-9.]/g, ''));
    }

    if (isNaN(price)) price = 0;

    switch (priceRange) {
      case '0-1200':
        return price >= 0 && price <= 1200;
      case '1200-2400':
        return price > 1200 && price <= 2400;
      case '2400-3600':
        return price > 2400 && price <= 3600;
      case '3600+':
        return price > 3600;
      default:
        return true;
    }
  });
};

/**
 * Filter products by brands
 */
export const filterByBrands = (products, selectedBrands) => {
  if (selectedBrands.length === 0) return products;

  return products.filter(product =>
    selectedBrands.includes(product.brand)
  );
};

/**
 * Filter products by colors
 */
export const filterByColors = (products, selectedColors) => {
  if (selectedColors.length === 0) return products;

  return products.filter(product => {
    const productColors = Array.isArray(product.colors) ? product.colors : [];
    const colorFamilies = Array.isArray(product.colorFamilies) ? product.colorFamilies : [];

    // Check if any selected color matches either the color name or the color family
    return selectedColors.some(selected => {
      const lowerSelected = selected.toLowerCase();

      const matchName = productColors.some(color => color.toLowerCase() === lowerSelected);
      const matchFamily = colorFamilies.some(family => family.toLowerCase() === lowerSelected);

      return matchName || matchFamily;
    });
  });
};

export const filterByCategory = (products, categorySlug) => {
  if (!categorySlug) return products;

  return products.filter(product => {
    // Handle both string category and object category from backend
    const slug = product.category?.slug ||
      (typeof product.category === 'string' ? product.category.toLowerCase().replace(/\s+/g, '-') : '');

    return slug === categorySlug;
  });
};

/**
 * Sort products
 */
export const sortProducts = (products, sortBy) => {
  const sorted = [...products];

  switch (sortBy) {
    case 'price-low':
      sorted.sort((a, b) => {
        const getPrice = (p) => {
          if (typeof p === 'number') return p;
          if (typeof p === 'string') return parseFloat(p.replace(/[^0-9.]/g, '')) || 0;
          if (p && p.$numberDecimal) return parseFloat(p.$numberDecimal) || 0;
          return parseFloat(String(p).replace(/[^0-9.]/g, '')) || 0;
        };
        return getPrice(a.price) - getPrice(b.price);
      });
      break;
    case 'price-high':
      sorted.sort((a, b) => {
        const getPrice = (p) => {
          if (typeof p === 'number') return p;
          if (typeof p === 'string') return parseFloat(p.replace(/[^0-9.]/g, '')) || 0;
          if (p && p.$numberDecimal) return parseFloat(p.$numberDecimal) || 0;
          return parseFloat(String(p).replace(/[^0-9.]/g, '')) || 0;
        };
        return getPrice(b.price) - getPrice(a.price);
      });
      break;
    case 'newness':
      sorted.reverse();
      break;
    case 'popularity':
    case 'rating':
    default:
      // Keep original order
      break;
  }

  return sorted;
};

/**
 * Explode each product into one card per color.
 *
 * Used on the Category page so a product with N colours renders as N cards.
 * Each card keeps the original product.id (favourites + routing keep working)
 * but overrides the displayed name (`${color} ${name}`), images,
 * price, and variants to reflect just that colour. A `_cardKey` field gives
 * the React grid a unique key per card.
 */
export const explodeProductsByColor = (products) => {
  if (!Array.isArray(products)) return [];

  const exploded = [];

  for (const product of products) {
    const variants = Array.isArray(product.variants) ? product.variants : [];
    if (variants.length === 0) {
      exploded.push(product);
      continue;
    }

    const byColor = new Map();
    for (const variant of variants) {
      const colorName = variant.color?.name;
      if (!colorName) continue;
      if (!byColor.has(colorName)) {
        byColor.set(colorName, { color: variant.color, variants: [] });
      }
      byColor.get(colorName).variants.push(variant);
    }

    if (byColor.size === 0) {
      exploded.push(product);
      continue;
    }

    for (const [colorName, group] of byColor) {
      const colorId = group.color?.id ?? colorName;
      const family = group.color?.family ?? null;
      const colorVariants = group.variants;
      // We intentionally do NOT append size to the card name on category pages.

      const colorImages = Array.isArray(product.colorImages)
        ? product.colorImages
            .filter((ci) => ci.colorId === colorId || ci.color?.id === colorId)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((ci) => ci.imageUrl)
            .filter(Boolean)
        : [];

      const fallbackImages = Array.isArray(product.images) ? product.images : [];
      const images = colorImages.length > 0 ? colorImages : fallbackImages;
      const image = images[0] || product.image || null;

      const variantPrices = colorVariants
        .map((v) => Number(v.price ?? 0))
        .filter((n) => Number.isFinite(n) && n > 0);
      const price = variantPrices.length > 0 ? Math.min(...variantPrices) : product.price;

      const sizes = [...new Set(colorVariants.map((v) => v.size?.name).filter(Boolean))];
      const nameParts = [colorName, product.name].filter(Boolean);

      exploded.push({
        ...product,
        _cardKey: `${product.id}::${colorId}`,
        _colorName: colorName,
        name: nameParts.join(' '),
        image,
        images,
        colors: [colorName],
        colorFamilies: family ? [family] : [],
        sizes,
        price,
        variants: colorVariants,
      });
    }
  }

  return exploded;
};

/**
 * Apply all filters and sorting to products
 */
export const applyFilters = (products, filters, category = null) => {
  let filtered = category
    ? filterByCategory(products, category)
    : [...products];

  filtered = filterByPriceRange(filtered, filters.priceRange);
  filtered = filterByBrands(filtered, filters.selectedBrands);
  filtered = filterByColors(filtered, filters.selectedColors);
  filtered = sortProducts(filtered, filters.sortBy);

  return filtered;
};

/**
 * Get price range display text
 */
export const getPriceRangeText = (priceRange) => {
  const rangeMap = {
    '0-1200': '0.00 - 1,200 EGP',
    '1200-2400': '1,200 - 2,400 EGP',
    '2400-3600': '2,400 - 3,600 EGP',
    '3600+': '3,600 EGP +',
  };
  return rangeMap[priceRange] || priceRange;
};

