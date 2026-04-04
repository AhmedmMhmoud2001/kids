import { Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { DEFAULT_CURRENCY, formatPrice } from "../../utils/currency";
import { useProductOfferDiscount } from "../../hooks/useOffers";
import { useLanguage } from "../../context/LanguageContext";

const ProductCard = ({ product, onQuickView }) => {
  const { toggleFavorite, isFavorite } = useApp();
  const { t } = useLanguage();
  const productIsFavorite = isFavorite(product.id);

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  const handleQuickView = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  };

  const getProductImage = () => {
    if (product.image) return product.image;
    if (product.thumbnails) {
      try {
        const thumbs = typeof product.thumbnails === 'string'
          ? JSON.parse(product.thumbnails)
          : product.thumbnails;
        if (Array.isArray(thumbs) && thumbs.length > 0) return thumbs[0];
        if (typeof thumbs === 'string') return thumbs;
      } catch (e) {
        console.error("Error parsing thumbnails", e);
      }
    }
    return null;
  };

  const productImage = getProductImage();
  const displayPrice = typeof product.price === 'number' ? product.price : Number(product.price || 0);
  const discountPercent = useProductOfferDiscount(product);
  const discountedPrice = discountPercent > 0
    ? displayPrice * (1 - discountPercent / 100)
    : displayPrice;

  return (
    <div className="group relative">
      <Link to={`/product/${product.id}`} className="block">
        {/* Product Image */}
        <div className="relative aspect-square bg-blue-50/50  overflow-hidden mb-3 border border-gray-100 flex items-center justify-center">
          {discountPercent > 0 && (
            <div className="absolute top-3 -left-8 z-20 rotate-[-35deg] bg-red-600 text-white text-[11px] sm:text-xs font-bold px-8 py-1 shadow-md">
              -{Number(discountPercent).toFixed(0)}%
            </div>
          )}
          {productImage ? (
            <img
              src={productImage}
              alt={product.name}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentElement.classList.add("bg-gray-100");
                e.target.parentElement.innerHTML += '<div class="text-blue-200 font-bold text-4xl uppercase select-none">' + product.name.substring(0, 2) + '</div>';
              }}
            />
          ) : (
            <div className="text-blue-200 font-bold text-4xl uppercase select-none">
              {product.name.substring(0, 2)}
            </div>
          )}

          {/* Shop Now Button */}
          <div
            className="absolute inset-x-0 bottom-0 mx-4 mb-1 bg-white/95 backdrop-blur-sm text-gray-500 hover:text-gray-900 font-medium py-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-blue-100 text-center"
          >
            <span className="w-full h-full hover:scale-110 hover:text-black transition-all z-10 uppercase text-sm tracking-wider">
              shop now
            </span>
          </div>

          {/* Favorite Button */}
          <button
            onClick={handleToggleFavorite}
            className="absolute top-16 right-0 w-8 h-8 bg-blue-100 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 scale-90 group-hover:opacity-100 group-hover:right-3 hover:scale-110 transition-all duration-300 z-10"
          >
            <svg
              className={`w-5 h-5 hover:fill-slate-950 hover:text-slate-950 ${productIsFavorite
                ? "fill-slate-950 text-slate-950"
                : "fill-none text-gray-400"
                }`}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>

          {/* ✅ Quick View Button (Eye) */}
          <button
            onClick={handleQuickView}
            className="absolute top-3 right-0 w-8 h-8 bg-blue-100 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 scale-90 group-hover:opacity-100 group-hover:right-3 hover:scale-110 transition-all duration-300 z-10"
          >
            <svg
              className="w-5 h-5 fill-none text-gray-400 hover:text-slate-100 hover:fill-slate-950"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.036 12.322a1 1 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.577 3.01 9.964 7.178a1 1 0 010 .644C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.577-3.01-9.964-7.178z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>

        {/* Product Info */}
        <div className="space-y-1">
          <h3 className="text-sm font-normal text-gray-900 line-clamp-2 leading-tight">
            {t(product.name)}
          </h3>
          <p className="text-xs text-gray-500">
            {t(product.categoryDisplay || product.category?.name || product.category)}
          </p>
          {discountPercent > 0 ? (
            <div className="flex items-center gap-2">
              <p className="text-gray-400 line-through text-xs">
                {formatPrice(displayPrice, DEFAULT_CURRENCY)}
              </p>
              <p className="text-blue-500 font-semibold text-sm">
                {formatPrice(discountedPrice, DEFAULT_CURRENCY)}
              </p>
            </div>
          ) : (
            <p className="text-blue-500 font-semibold text-sm">
              {formatPrice(displayPrice, DEFAULT_CURRENCY)}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
