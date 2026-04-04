import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { getColorSwatchStyle } from '../../api/products';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useProductOfferDiscount } from '../../hooks/useOffers';
import { useLanguage } from '../../context/LanguageContext';

const THUMB_VISIBLE = 6;

const ProductQuickView = ({ product, onClose }) => {
  const { addToCart, setIsCartOpen } = useApp();
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState(0);
  const [visibleThumbStart, setVisibleThumbStart] = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const colorName = product.colors?.[selectedColor];
  const images = useMemo(() => {
    if (!product) return [];
    if (product.colorImages?.length > 0 && colorName) {
      const nameLower = (colorName || '').toString().toLowerCase().trim();
      const forColor = product.colorImages
        .filter((ci) => {
          const n = (ci.color?.name ?? ci.colorName ?? '').toString().toLowerCase().trim();
          return n && n === nameLower;
        })
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((ci) => ci.imageUrl)
        .filter(Boolean);
      if (forColor.length > 0) return forColor;
    }
    return (product.images?.length > 0) ? product.images : (product.image ? [product.image] : []);
  }, [product?.colorImages, product?.images, product?.image, colorName]);

  const thumbCount = images.length;
  const maxThumbStart = Math.max(0, thumbCount - THUMB_VISIBLE);
  const clampedThumbStart = Math.min(Math.max(0, visibleThumbStart), maxThumbStart);
  const visibleThumbnails = useMemo(() => {
    if (!images.length) return [];
    return images.slice(clampedThumbStart, clampedThumbStart + THUMB_VISIBLE).map((img, i) => ({ img, globalIndex: clampedThumbStart + i }));
  }, [images, clampedThumbStart]);

  useEffect(() => {
    setVisibleThumbStart(0);
  }, [selectedColor]);

  const selectedVariant = useMemo(() => {
    if (!product?.variants?.length || !product.colors?.length || !product.sizes?.length) return null;
    const c = (product.colors[selectedColor] ?? '').toString().toLowerCase().trim();
    const s = (product.sizes[selectedSize] ?? '').toString().toLowerCase().trim();
    return product.variants.find((v) =>
      (v.color?.name ?? '').toString().toLowerCase().trim() === c &&
      (v.size?.name ?? '').toString().toLowerCase().trim() === s
    ) || product.variants.find((v) => (v.color?.name ?? '').toString().toLowerCase().trim() === c) || product.variants[0];
  }, [product?.variants, product?.colors, product?.sizes, selectedColor, selectedSize]);

  const displayPrice = selectedVariant?.price ?? product.price ?? product.basePrice;
  const safePrice = typeof displayPrice === 'number' && !Number.isNaN(displayPrice)
    ? displayPrice
    : (parseFloat(displayPrice) || 0);
  const discountPercent = useProductOfferDiscount(product);
  const finalPrice = discountPercent > 0
    ? safePrice * (1 - discountPercent / 100)
    : safePrice;

  const handleAddToCart = () => {
    const color = product.colors?.[selectedColor];
    const size = product.sizes?.[selectedSize];
    const productWithVariantPrice = { ...product, price: finalPrice };
    addToCart(productWithVariantPrice, quantity, size, color, selectedVariant?.id);
    setIsCartOpen(true);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      {/* Modal Container */}
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col md:flex-row gap-6 p-6 max-h-[90vh] overflow-y-auto scrollbar-hide">
          {/* Left Side - Images */}
          <div className="flex gap-4 shrink-0 w-full md:w-[420px]">
            {/* Thumbnails: 6 visible, arrows to move */}
            <div className="flex flex-col items-center gap-1 w-[55px] shrink-0">
              {thumbCount > THUMB_VISIBLE && (
                <button
                  type="button"
                  onClick={() => setVisibleThumbStart((i) => Math.max(0, i - 1))}
                  disabled={clampedThumbStart <= 0}
                  className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none mb-1"
                  aria-label="Previous images"
                >
                  <ChevronUp size={14} />
                </button>
              )}
              <div className="flex flex-col gap-2">
                {visibleThumbnails.map(({ img, globalIndex }) => (
                  <button
                    key={globalIndex}
                    type="button"
                    onClick={() => setSelectedImage(globalIndex)}
                    className={`aspect-[1/1] w-[55px] border-2 rounded-md overflow-hidden transition-all ${selectedImage === globalIndex ? 'border-blue-500' : 'border-gray-100'}`}
                  >
                    <img
                      src={img || null}
                      alt={`Thumbnail ${globalIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              {thumbCount > THUMB_VISIBLE && (
                <button
                  type="button"
                  onClick={() => setVisibleThumbStart((i) => Math.min(maxThumbStart, i + 1))}
                  disabled={clampedThumbStart >= maxThumbStart}
                  className="w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none mt-1"
                  aria-label="Next images"
                >
                  <ChevronDown size={14} />
                </button>
              )}
            </div>

            {/* Main Image */}
            <div className="flex-1 h-[350px] md:h-[450px] rounded-xl overflow-hidden border border-gray-100">
              <Link to={`/product/${product.id}`} onClick={onClose}>
                <img
                  src={images[Math.min(selectedImage, images.length - 1)] || null}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                />
              </Link>
            </div>
          </div>

          {/* Right Side - Product Info */}
          <div className="flex flex-col gap-4 flex-1 min-w-0">
            {/* Product Name */}
            <div>
              <Link
                to={`/product/${product.id}`}
                onClick={onClose}
                className="text-xl font-bold text-gray-900 leading-tight hover:text-blue-600 transition-colors block"
              >
                {t(product.name)}
              </Link>
              <div className="mt-1">
                <Link
                  to={`/product/${product.id}`}
                  onClick={onClose}
                  className="text-xs text-blue-500 hover:underline font-medium"
                >
                  View full details →
                </Link>
              </div>
            </div>

            {/* Price */}
            {discountPercent > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-sm text-gray-400 line-through">
                  {safePrice.toFixed(2)} EGP
                </div>
                <div className="text-2xl font-black text-blue-600">
                  {finalPrice.toFixed(2)} EGP
                </div>
                <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 font-semibold">
                  -{discountPercent}%
                </span>
              </div>
            ) : (
              <div className="text-2xl font-black text-blue-600">
                {safePrice.toFixed(2)} EGP
              </div>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-gray-700">Color:</span>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color, idx) => {
                    const swatchStyle = getColorSwatchStyle(color);
                    const hasBg = swatchStyle.backgroundColor;
                    return (
                      <button
                        key={idx}
                        onClick={() => { setSelectedColor(idx); setSelectedImage(0); }}
                        className={`w-7 h-7 rounded-full border border-gray-200 transition-all flex items-center justify-center shrink-0 ${selectedColor === idx ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'}
                          ${!hasBg ? 'min-w-[1.75rem] text-[10px] text-gray-600 font-bold bg-gray-50' : ''}`}
                        style={hasBg ? swatchStyle : {}}
                        title={typeof color === 'string' ? color : ''}
                      >
                        {!hasBg && <span className="truncate">{typeof color === 'string' ? color.charAt(0) : ''}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-bold text-gray-700">Size:</span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedSize(idx)}
                      className={`min-w-[40px] h-9 px-3 border-2 rounded-lg text-sm font-bold transition-all ${selectedSize === idx
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-gray-100 text-gray-400 hover:border-gray-200 hover:text-gray-600'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="flex gap-3 mt-2">
              {/* Quantity Selector */}
              <div className="flex items-center gap-1 border-2 border-gray-100 rounded-xl px-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-1 hover:text-blue-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18 12H6" />
                  </svg>
                </button>
                <span className="w-8 text-sm font-bold text-gray-700 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-1 hover:text-blue-500 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v12M6 12h12" />
                  </svg>
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm h-11 rounded-xl transition-all shadow-lg active:scale-95"
              >
                Add to cart
              </button>
            </div>

            {/* Description */}
            {(product.description || product.shortDescription) && (
              <div className="flex flex-col gap-1 mt-2">
                <h3 className="text-sm font-bold text-gray-700">Description:</h3>
                <p className="text-sm text-gray-500 leading-snug line-clamp-3">
                  {product.description || product.shortDescription}
                </p>
              </div>
            )}

            {/* Product Meta Info */}
            <div className="pt-3 border-t border-gray-50 grid grid-cols-2 gap-y-2 gap-x-4">
              {/* SKU */}
              <div className="flex flex-col text-[12px]">
                <span className="font-bold text-gray-400 uppercase tracking-tighter">SKU</span>
                <span className="text-gray-700 font-medium truncate">{product.sku || 'N/A'}</span>
              </div>

              {/* Category */}
              <div className="flex flex-col text-[12px]">
                <span className="font-bold text-gray-400 uppercase tracking-tighter">Category</span>
                <span className="text-gray-700 font-medium truncate">{t(product.categoryName)}</span>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-all text-gray-400 hover:text-gray-600 z-10"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductQuickView;
