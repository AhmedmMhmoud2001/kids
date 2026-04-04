import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Eye, X, Heart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchProducts, deleteProduct } from '../api/products';
import { fetchSettings } from '../api/settings';
import { getSafeImageUrl, getProductDisplayImage, getProductAllImages } from '../utils/imageUtils';
import { useLanguage } from '../context/LanguageContext';
import { tx } from '../i18n/text';

const ProductsList = ({ audience, title }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [siteStats, setSiteStats] = useState({ active: 0, inactive: 0, totalValue: 0 }); // New state for stats
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [modalSelectedColor, setModalSelectedColor] = useState(null);
    const [offerDiscountByProductId, setOfferDiscountByProductId] = useState({});
    const getCategoryRateToEgp = (product) => {
        const rate = Number(product?.category?.exchangeRateToEgp || 1);
        return Number.isFinite(rate) && rate > 0 ? rate : 1;
    };
    const toEgp = (product, rawPrice) => {
        const price = Number(rawPrice || 0);
        if (!Number.isFinite(price)) return 0;
        return price * getCategoryRateToEgp(product);
    };
    const getDiscountForProduct = (productId) => {
        if (!productId) return 0;
        return Number(offerDiscountByProductId[String(productId)] || 0);
    };
    const applyDiscount = (price, discountPercent) => {
        const p = Number(price || 0);
        const d = Number(discountPercent || 0);
        if (!Number.isFinite(p) || p <= 0 || !Number.isFinite(d) || d <= 0) return p;
        return p * (1 - d / 100);
    };

    const ITEMS_PER_PAGE = 24;

    useEffect(() => {
        setCurrentPage(1); // Reset to page 1 when audience changes
    }, [audience]);

    useEffect(() => {
        loadProducts();
    }, [audience, currentPage, searchTerm]); // Reload on page/search change

    // Refetch when returning from edit/create so variant changes appear
    useEffect(() => {
        if (location.state?.refreshList) {
            loadProducts();
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state?.refreshList]);

    // When opening product modal, default selected color to first available
    useEffect(() => {
        if (!selectedProduct?.variants?.length) {
            setModalSelectedColor(null);
            return;
        }
        const firstColor = selectedProduct.variants[0]?.color?.name;
        setModalSelectedColor((prev) => (firstColor != null ? firstColor : prev));
    }, [selectedProduct?.id]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            // Search term should ideally be handled by backend for full efficiency,
            // but if backend supports it via 'search', pass it.
            // Assuming fetchProducts supports pagination params in options
            const [response, settingsRes] = await Promise.all([
                fetchProducts(audience, {
                    limit: ITEMS_PER_PAGE,
                    page: currentPage,
                    search: searchTerm
                }),
                fetchSettings()
            ]);

            if (response.success) {
                // Backend standard paginated response:
                // { success: true, data: [...], pagination: { total, page, limit, ... } }

                const productsData = Array.isArray(response.data) ? response.data :
                    (response.products ? response.products : []);

                // 'pagination' object contains total, otherwise fallback
                const totalCount = response.pagination?.total || response.total || productsData.length;

                setProducts(productsData);
                setTotalProducts(totalCount);
                if (settingsRes?.success) {
                    const row = (settingsRes.data || []).find((s) => s.key === 'top_header_offers');
                    const parsed = row?.value ? JSON.parse(row.value) : [];
                    const discountMap = {};
                    if (Array.isArray(parsed)) {
                        productsData.forEach((product) => {
                            const pid = String(product?.id || '');
                            const pCategorySlug = String(product?.category?.slug || '').toLowerCase().trim();
                            const pBrandSlug = String(product?.brandRel?.slug || product?.brandSlug || '').toLowerCase().trim();
                            let maxForProduct = 0;

                            parsed.forEach((offer) => {
                                if (!offer || offer.isActive === false) return;
                                const discount = Number(offer.discountPercent || 0);
                                if (!Number.isFinite(discount) || discount <= 0) return;
                                const ids = Array.isArray(offer.productIds)
                                    ? offer.productIds.map((v) => String(v))
                                    : String(offer.productIds || '').split(',').map((v) => v.trim()).filter(Boolean);
                                const offerCategorySlug = String(offer.categorySlug || '').toLowerCase().trim();
                                const offerBrandSlug = String(offer.brandSlug || '').toLowerCase().trim();
                                const matchesProduct = pid ? ids.includes(pid) : false;
                                const matchesCategory = Boolean(offerCategorySlug && pCategorySlug && offerCategorySlug === pCategorySlug);
                                const matchesBrand = Boolean(offerBrandSlug && pBrandSlug && offerBrandSlug === pBrandSlug);
                                if (!matchesProduct && !matchesCategory && !matchesBrand) return;
                                maxForProduct = Math.max(maxForProduct, discount);
                            });
                            if (pid) discountMap[pid] = maxForProduct;
                        });
                    }
                    setOfferDiscountByProductId(discountMap);
                }
                if (response.stats) {
                    setSiteStats(response.stats); // Set the stats from backend
                } else if (!response.pagination) {
                    // Fallback if stats not returned (e.g. older backend version)
                    setSiteStats({
                        active: productsData.filter(p => p.isActive).length,
                        inactive: productsData.filter(p => !p.isActive).length,
                        totalValue: productsData.reduce((sum, p) => sum + toEgp(p, parseFloat(p.basePrice ?? p.price) || 0), 0)
                    });
                }

                // Keep modal in sync
                setSelectedProduct((prev) => {
                    if (!prev) return null;
                    const updated = productsData.find((p) => p.id === prev.id);
                    return updated ?? prev;
                });
                setModalSelectedColor(null);
            } else {
                setError('Failed to load products');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                const response = await deleteProduct(id);
                if (response.success) {
                    setProducts(products.filter(p => p.id !== id));
                } else {
                    alert('Failed to delete product');
                }
            } catch (err) {
                console.error(err);
                alert('Error deleting product: ' + err.message);
            }
        }
    };

    const safeParse = (data, fallback = []) => {
        if (!data) return fallback;
        if (typeof data !== 'string') return data;
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error("JSON Parse Error:", e, "Data:", data);
            return fallback;
        }
    };

    const DEFAULT_LOW_STOCK = 5;
    const hasLowStockVariant = (product) => {
        const variants = product.variants || [];
        return variants.some(v => {
            const threshold = v.lowStockThreshold != null ? v.lowStockThreshold : DEFAULT_LOW_STOCK;
            return (v.stock ?? 0) <= threshold;
        });
    };

    // Client-side filtering is replaced by server-side search in loadProducts useEffect
    // but we might want to keep filteredProducts variable name to minimize diff changes if used below
    const filteredProducts = products;

    if (loading) return <div className="p-4 text-center">Loading products...</div>;
    if (error) return <div className="p-4 text-center text-red-600">Error: {error}</div>;

    return (
        <div className="space-y-6 overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{t(title)}</h1>
                    <p className="text-sm md:text-base text-gray-600 mt-1 uppercase tracking-tight">{t(tx('Manage products for', 'إدارة المنتجات لفئة'))} {audience}</p>
                </div>
                <button
                    onClick={() => navigate(`/${audience.toLowerCase()}/products/new`)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md font-medium whitespace-nowrap"
                >
                    <Plus size={20} />
                    {t(tx('Add Product', 'إضافة منتج'))}
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder={t(tx('Search products by name, SKU, or brand...', 'ابحث عن المنتجات بالاسم أو SKU أو العلامة...'))}
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1); // Reset to page 1 on search
                        }}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        {/* Product Image */}
                        <div className="relative h-48 bg-blue-50/50 flex items-center justify-center">
                            {getProductDisplayImage(product) ? (
                                <img
                                    src={getSafeImageUrl(getProductDisplayImage(product))}
                                    alt={t(product.name)}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-blue-200 font-bold text-4xl uppercase select-none">
                                    {t(product.name).substring(0, 2)}
                                </div>
                            )}
                            <div className="absolute top-2 right-2 flex flex-col gap-1">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${product.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                    }`}>
                                    {product.isActive ? t(tx('Active', 'نشط')) : t(tx('Inactive', 'غير نشط'))}
                                </span>
                                {product.isBestSeller && (
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                        ⭐ {t(tx('Best Seller', 'الأكثر مبيعًا'))}
                                    </span>
                                )}
                                {product.variants?.length > 0 && hasLowStockVariant(product) && (
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800" title={t(tx('One or more variants are low on stock', 'يوجد متغير أو أكثر منخفض المخزون'))}>
                                        {t(tx('Low Stock', 'مخزون منخفض'))}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Product Info */}
                        <div className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-1 truncate">{t(product.name)}</h3>
                            <p className="text-sm text-gray-500 mb-1">{t(tx('SKU', 'رمز المنتج'))}: <span className="font-semibold text-gray-800">{product.sku || '-'}</span></p>
                            {product.variants?.length > 0 && <p className="text-xs text-gray-400 mb-1">{product.variants.length} variants</p>}
                            <p className="text-xs text-gray-500 mb-2">
                                {t(tx('Stock', 'المخزون'))}: <span className="font-semibold text-gray-800">{product.variants?.length ? product.variants.reduce((s, v) => s + (v.stock || 0), 0) : (product.stock ?? 0)}</span>
                            </p>
                            <p className="text-lg font-bold text-blue-600 mb-2">
                                {product.variants?.length ? 'from ' : ''}{toEgp(product, product.basePrice ?? product.price ?? 0).toFixed(2)} EGP
                            </p>

                            {/* Likes Count */}
                            <div className="flex items-center gap-1 mb-3">
                                <Heart className="text-red-500 fill-red-500" size={18} />
                                <span className="text-sm font-semibold text-gray-700">
                                    {product._count?.favorites || 0} {product._count?.favorites === 1 ? 'Like' : 'Likes'}
                                </span>
                            </div>

                            {(product.brandRel?.name || product.brand) && (
                                <p className="text-xs text-gray-500 mb-3">Brand: {t(product.brandRel?.name || product.brand)}</p>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSelectedProduct(product)}
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                >
                                    <Eye size={16} />
                                    View
                                </button>
                                <button
                                    onClick={() => navigate(`/${audience.toLowerCase()}/products/${product.id}/edit`)}
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                >
                                    <Edit2 size={16} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredProducts.length === 0 && !loading && (
                <div className="text-center py-12 bg-white rounded-lg">
                    <p className="text-gray-500">No products found</p>
                </div>
            )}

            {/* Pagination Controls */}
            {totalProducts > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-600">
                        Showing <span className="font-medium">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, totalProducts)}</span> to{' '}
                        <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, totalProducts)}</span> of{' '}
                        <span className="font-medium">{totalProducts}</span> products
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || loading}
                            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>

                        {/* Simple Page Numbers */}
                        {Array.from({ length: Math.ceil(totalProducts / ITEMS_PER_PAGE) }, (_, i) => i + 1)
                            .filter(p => p === 1 || p === Math.ceil(totalProducts / ITEMS_PER_PAGE) || Math.abs(currentPage - p) <= 2)
                            .map((p, i, arr) => (
                                <React.Fragment key={p}>
                                    {i > 0 && arr[i - 1] !== p - 1 && <span className="px-1 text-gray-400">...</span>}
                                    <button
                                        onClick={() => setCurrentPage(p)}
                                        className={`w-8 h-8 rounded flex items-center justify-center text-sm ${currentPage === p
                                            ? 'bg-blue-600 text-white font-medium'
                                            : 'text-gray-600 hover:bg-gray-100'
                                            }`}
                                    >
                                        {p}
                                    </button>
                                </React.Fragment>
                            ))
                        }

                        <button
                            onClick={() => setCurrentPage(p => p + 1)}
                            disabled={currentPage >= Math.ceil(totalProducts / ITEMS_PER_PAGE) || loading}
                            className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="text-sm text-gray-600">Total Products</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">{totalProducts}</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="text-sm text-gray-600">Active Products</div>
                    <div className="text-2xl font-bold text-green-600 mt-1">
                        {siteStats.active}
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="text-sm text-gray-600">Inactive Products</div>
                    <div className="text-2xl font-bold text-red-600 mt-1">
                        {siteStats.inactive}
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="text-sm text-gray-600">Total Value</div>
                    <div className="text-2xl font-bold text-blue-600 mt-1">
                        {siteStats.totalValue?.toFixed(2) || '0.00'} EGP
                    </div>
                </div>
            </div>

            {/* Product Detail Modal */}
            {selectedProduct && (
                (() => {
                    const selectedDiscount = getDiscountForProduct(selectedProduct.id);
                    return (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-2000 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-in-bottom">
                        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between gap-2">
                            <h2 className="text-xl font-bold truncate flex-1">{selectedProduct.name}</h2>
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => {
                                        setSelectedProduct(null);
                                        navigate(`/${audience.toLowerCase()}/products/${selectedProduct.id}/edit`);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                >
                                    <Edit2 size={16} />
                                    Edit
                                </button>
                                <button
                                    onClick={() => setSelectedProduct(null)}
                                    className="p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Images */}
                            {getProductAllImages(selectedProduct).length > 0 && (
                                <div>
                                    <p className="text-sm text-gray-600 mb-2 font-semibold">Product Images ({getProductAllImages(selectedProduct).length})</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {getProductAllImages(selectedProduct).map((img, idx) => (
                                            <div key={idx} className="relative group">
                                                <img
                                                    src={getSafeImageUrl(img)}
                                                    alt={`${selectedProduct.name} ${idx + 1}`}
                                                    className="w-full h-32 object-cover rounded border border-gray-200 hover:border-blue-500 transition-all cursor-pointer"
                                                />
                                                <div className="absolute top-1 right-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                                                    {idx + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Base Price</p>
                                    {selectedDiscount > 0 ? (
                                        <div className="space-y-1">
                                            <p className="text-xs text-gray-400 line-through">
                                                {toEgp(selectedProduct, selectedProduct.basePrice ?? selectedProduct.price ?? 0).toFixed(2)} EGP
                                            </p>
                                            <p className="font-semibold text-blue-600">
                                                {applyDiscount(
                                                    toEgp(selectedProduct, selectedProduct.basePrice ?? selectedProduct.price ?? 0),
                                                    selectedDiscount
                                                ).toFixed(2)} EGP
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="font-semibold text-blue-600">
                                            {toEgp(selectedProduct, selectedProduct.basePrice ?? selectedProduct.price ?? 0).toFixed(2)} EGP
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Likes</p>
                                    <div className="flex gap-1 items-center">
                                        <Heart className="text-red-500 fill-red-500" size={16} />
                                        <p className="font-semibold">{selectedProduct._count?.favorites || 0}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Brand</p>
                                    <p className="font-semibold">{selectedProduct.brandRel?.name ?? selectedProduct.brand ?? 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Status</p>
                                    <p className={`font-semibold ${selectedProduct.isActive ? 'text-green-600' : 'text-red-600'}`}>
                                        {selectedProduct.isActive ? 'Active' : 'Inactive'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Product SKU</p>
                                    <p className="font-semibold text-gray-800">{selectedProduct.sku || 'N/A'}</p>
                                </div>
                            </div>

                            {selectedProduct.variants?.length > 0 && (
                                <div>
                                    <p className="text-sm text-gray-600 mb-2">Variants (color / size / price / stock)</p>
                                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-3 py-2 text-right font-medium text-gray-600">Color</th>
                                                    <th className="px-3 py-2 text-right font-medium text-gray-600">Size</th>
                                                    <th className="px-3 py-2 text-right font-medium text-gray-600">Price</th>
                                                    <th className="px-3 py-2 text-right font-medium text-gray-600">Stock</th>
                                                    <th className="px-3 py-2 text-right font-medium text-gray-600">Low stock</th>
                                                    <th className="px-3 py-2 text-right font-medium text-gray-600">SKU</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {selectedProduct.variants.map((v) => {
                                                    const threshold = v.lowStockThreshold != null ? v.lowStockThreshold : DEFAULT_LOW_STOCK;
                                                    const isLow = (v.stock ?? 0) <= threshold;
                                                    return (
                                                        <tr key={v.id} className={isLow ? 'bg-amber-50/50' : ''}>
                                                            <td className="px-3 py-2">{v.color?.name ?? '-'}</td>
                                                            <td className="px-3 py-2">{v.size?.name ?? '-'}</td>
                                                            <td className="px-3 py-2 font-medium">
                                                                {selectedDiscount > 0 ? (
                                                                    <div className="space-y-0.5">
                                                                        <div className="text-xs text-gray-400 line-through">
                                                                            {toEgp(selectedProduct, v.price ?? selectedProduct.basePrice ?? 0).toFixed(2)} EGP
                                                                        </div>
                                                                        <div className="text-blue-600">
                                                                            {applyDiscount(
                                                                                toEgp(selectedProduct, v.price ?? selectedProduct.basePrice ?? 0),
                                                                                selectedDiscount
                                                                            ).toFixed(2)} EGP
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-blue-600">
                                                                        {toEgp(selectedProduct, v.price ?? selectedProduct.basePrice ?? 0).toFixed(2)} EGP
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="px-3 py-2">{v.stock ?? 0}</td>
                                                            <td className="px-3 py-2">
                                                                {isLow ? <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-100 text-amber-800">Low</span> : <span className="text-gray-400 text-xs">OK</span>}
                                                            </td>
                                                            <td className="px-3 py-2">{v.sku ?? '-'}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {selectedProduct.description && (
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Description</p>
                                    <p className="text-gray-800">{selectedProduct.description}</p>
                                </div>
                            )}

                            {((selectedProduct.variants || []).length > 0 && [...new Set((selectedProduct.variants || []).map(v => v.color?.name).filter(Boolean))].length > 0) && (() => {
                                const colors = [...new Set((selectedProduct.variants || []).map(v => v.color?.name).filter(Boolean))];
                                const effectiveColor = modalSelectedColor != null && colors.includes(modalSelectedColor) ? modalSelectedColor : (colors[0] ?? null);
                                const sizesForColor = effectiveColor
                                    ? [...new Set((selectedProduct.variants || []).filter(v => (v.color?.name ?? '') === effectiveColor).map(v => v.size?.name).filter(Boolean))]
                                    : [];
                                return (
                                    <>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Available Colors</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {colors.map((color, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => setModalSelectedColor(color)}
                                                        className={`px-3 py-1 rounded-full text-sm transition-colors ${effectiveColor === color ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-gray-100 hover:bg-gray-200'}`}
                                                    >
                                                        {color}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Available Sizes {effectiveColor ? `(${effectiveColor})` : ''}</p>
                                            <div className="flex gap-2 flex-wrap">
                                                {sizesForColor.length > 0 ? sizesForColor.map((size, idx) => (
                                                    <span key={idx} className="px-3 py-1 bg-gray-100 rounded-full text-sm">{size}</span>
                                                )) : (
                                                    <span className="text-gray-400 text-sm">Select a color</span>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}

                        </div>
                    </div>
                </div>
                    );
                })()
            )}
        </div>
    );
};

export default ProductsList;
