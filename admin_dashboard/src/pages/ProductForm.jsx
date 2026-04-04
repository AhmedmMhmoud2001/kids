import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchProduct, createProduct, updateProduct } from '../api/products';
import { fetchCategories } from '../api/categories';
import brandsApi from '../api/brands';
import { fetchSettings, updateSetting } from '../api/settings';
import { uploadImage, uploadProductImage } from '../api/upload';
import { getSafeImageUrl } from '../utils/imageUtils';
import ColorAutocomplete from '../components/ColorAutocomplete';
import { ArrowLeft, Save, Loader, Upload, X, Plus, Edit2 } from 'lucide-react';
import { parseLocalizedField, buildLocalizedField } from '../utils/localizedField';

const ProductForm = ({ audience }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [formData, setFormData] = useState({
        nameEn: '',
        nameAr: '',
        descriptionEn: '',
        descriptionAr: '',
        basePrice: '',
        price: '',
        sku: '',
        brandId: '',
        audience: audience,
        variants: [], // { id?, colorName, sizeName, price, stock, lowStockThreshold?, sku }
        colorImages: [], // { colorId?, colorName, images: [url1..url8] } – up to 8 images per color
        isActive: true,
        isBestSeller: false,
        categoryId: '',
        stock: ''
    });

    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);
    const [error, setError] = useState(null);
    const [offers, setOffers] = useState([]);
    const [selectedOfferIds, setSelectedOfferIds] = useState([]);
    const [newColorNameForImages, setNewColorNameForImages] = useState('');
    const [editingVariantIndex, setEditingVariantIndex] = useState(null);
    const [editVariantForm, setEditVariantForm] = useState(null);
    const selectedCategory = categories.find((cat) => String(cat.id) === String(formData.categoryId));
    const categoryCurrencyCode = selectedCategory?.currencyCode || 'EGP';
    const categoryExchangeRateToEgp = Number(selectedCategory?.exchangeRateToEgp || 1);

    const toEgp = (priceInCategoryCurrency) => {
        const price = Number(priceInCategoryCurrency);
        if (!Number.isFinite(price)) return null;
        const rate = Number.isFinite(categoryExchangeRateToEgp) && categoryExchangeRateToEgp > 0
            ? categoryExchangeRateToEgp
            : 1;
        return price * rate;
    };

    useEffect(() => {
        const loadInitialData = async () => {
            await Promise.all([loadCategories(), loadBrands(), loadOffers()]);
            if (isEditMode) {
                await loadProduct();
            } else {
                setInitialLoading(false); // Make sure to stop loading if not edit mode
            }
        };
        loadInitialData();
    }, [id]);

    const loadCategories = async () => {
        try {
            const response = await fetchCategories(audience);
            if (response.success) {
                setCategories(response.data);
            }
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    };

    const loadBrands = async () => {
        try {
            const response = await brandsApi.getAll();
            const brandsData = Array.isArray(response) ? response : (response.data || []);
            setBrands(brandsData);
        } catch (err) {
            console.error('Failed to load brands:', err);
        }
    };

    const loadOffers = async () => {
        try {
            const response = await fetchSettings();
            if (!response?.success) return;
            const row = (response.data || []).find((s) => s.key === 'top_header_offers');
            if (!row?.value) {
                setOffers([]);
                return;
            }
            const parsed = JSON.parse(row.value);
            if (!Array.isArray(parsed)) {
                setOffers([]);
                return;
            }
            const normalized = parsed
                .filter((o) => o && typeof o === 'object' && o.id)
                .map((o) => ({
                    id: String(o.id),
                    title: o.titleEn || o.titleAr || `Offer ${o.id}`,
                    isActive: o.isActive !== false,
                    productIds: Array.isArray(o.productIds) ? o.productIds.map((id) => String(id)) : []
                }));
            setOffers(normalized);
        } catch (err) {
            console.error('Failed to load offers:', err);
            setOffers([]);
        }
    };

    const loadProduct = async () => {
        try {
            setInitialLoading(true);
            const response = await fetchProduct(id);
            if (response.success) {
                const product = response.data;

                const parseJsonField = (field) => {
                    if (!field) return [];
                    if (Array.isArray(field)) return field;
                    if (typeof field === 'string') {
                        try {
                            return JSON.parse(field);
                        } catch (e) {
                            return [];
                        }
                    }
                    return [];
                };

                const variants = (product.variants || []).map(v => ({
                    id: v.id,
                    colorName: v.color?.name ?? '',
                    sizeName: v.size?.name ?? '',
                    price: v.price != null ? v.price : '',
                    stock: v.stock ?? 0,
                    lowStockThreshold: v.lowStockThreshold != null ? v.lowStockThreshold : '',
                    sku: v.sku ?? '',
                }));
                const byColor = {};
                (product.colorImages || []).forEach(ci => {
                    const cid = ci.colorId ?? ci.color?.id;
                    const cname = (ci.color && ci.color.name) ? ci.color.name : '';
                    if (cid == null && !cname) return;
                    const k = String(cid ?? cname);
                    if (!byColor[k]) byColor[k] = { colorId: cid, colorName: cname, images: Array(8).fill(null) };
                    if (ci.order >= 1 && ci.order <= 8) byColor[k].images[ci.order - 1] = ci.imageUrl || null;
                });
                const colorImages = Object.values(byColor).map(ci => ({
                    colorId: ci.colorId,
                    colorName: ci.colorName,
                    images: (ci.images || []).map(url => url || null)
                }));
                setFormData({
                    nameEn: parseLocalizedField(product.name).en,
                    nameAr: parseLocalizedField(product.name).ar,
                    descriptionEn: parseLocalizedField(product.description || '').en,
                    descriptionAr: parseLocalizedField(product.description || '').ar,
                    basePrice: product.basePrice != null ? product.basePrice : '',
                    price: '',
                    sku: product.sku || '',
                    brandId: product.brandId ?? '',
                    audience: product.audience,
                    variants,
                    colorImages: colorImages.length ? colorImages : [],
                    isActive: product.isActive,
                    isBestSeller: product.isBestSeller ?? false,
                    categoryId: product.categoryId || '',
                    stock: ''
                });
                try {
                    const offersResponse = await fetchSettings();
                    if (offersResponse?.success) {
                        const row = (offersResponse.data || []).find((s) => s.key === 'top_header_offers');
                        const parsed = row?.value ? JSON.parse(row.value) : [];
                        const selected = Array.isArray(parsed)
                            ? parsed
                                .filter((o) => Array.isArray(o?.productIds) && o.productIds.map(String).includes(String(product.id)))
                                .map((o) => String(o.id))
                            : [];
                        setSelectedOfferIds(selected);
                    }
                } catch {
                    setSelectedOfferIds([]);
                }
            } else {
                setError('Failed to load product details');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const addVariant = () => {
        setFormData(prev => ({
            ...prev,
            variants: [...prev.variants, { colorName: '', sizeName: '', price: '', stock: 0, lowStockThreshold: '', sku: '' }]
        }));
    };

    const updateVariant = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.map((v, i) =>
                i === index ? { ...v, [field]: value } : v
            )
        }));
    };

    const removeVariant = (index) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.filter((_, i) => i !== index)
        }));
    };

    const openEditVariant = (index) => {
        const v = formData.variants[index];
        if (!v) return;
        setEditVariantForm({
            colorName: v.colorName ?? '',
            sizeName: v.sizeName ?? '',
            price: v.price ?? '',
            stock: v.stock ?? 0,
            lowStockThreshold: v.lowStockThreshold ?? '',
            sku: v.sku ?? '',
        });
        setEditingVariantIndex(index);
    };

    const saveEditVariant = () => {
        if (editingVariantIndex == null || !editVariantForm) return;
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.map((v, i) =>
                i === editingVariantIndex
                    ? { ...v, ...editVariantForm }
                    : v
            )
        }));
        setEditingVariantIndex(null);
        setEditVariantForm(null);
    };

    const cancelEditVariant = () => {
        setEditingVariantIndex(null);
        setEditVariantForm(null);
    };

    const addColorImageEntry = (colorName) => {
        if (!colorName?.trim()) return;
        setFormData(prev => {
            if (prev.colorImages.some(ci => (ci.colorName || '').trim() === colorName.trim())) return prev;
            return { ...prev, colorImages: [...prev.colorImages, { colorName: colorName.trim(), images: [] }] };
        });
    };

    const updateColorImages = (colorIndex, images) => {
        setFormData(prev => ({
            ...prev,
            colorImages: prev.colorImages.map((ci, i) => i === colorIndex ? { ...ci, images } : ci)
        }));
    };

    const addColorImageUrl = (colorIndex, url) => {
        setFormData(prev => {
            const ci = prev.colorImages[colorIndex];
            if (!ci) return prev;
            const images = [...(ci.images || [])];
            const filled = images.filter(Boolean).length;
            if (filled >= 8) return prev;
            const firstEmpty = images.findIndex(x => !x);
            if (firstEmpty >= 0) images[firstEmpty] = url;
            else images.push(url);
            const newImages = images.length > 8 ? images.slice(0, 8) : images;
            return { ...prev, colorImages: prev.colorImages.map((c, i) => i === colorIndex ? { ...c, images: newImages } : c) };
        });
    };

    const removeColorImageUrl = (colorIndex, imageIndex) => {
        setFormData(prev => ({
            ...prev,
            colorImages: prev.colorImages.map((c, i) => i === colorIndex ? { ...c, images: (c.images || []).filter((_, j) => j !== imageIndex) } : c)
        }));
    };

    const handleColorImageUpload = async (colorIndex, e) => {
        const file = e?.target?.files?.[0];
        if (!file) return;
        try {
            setUploading(true);
            setError(null);
            const result = await uploadProductImage(file);
            addColorImageUrl(colorIndex, result.url);
        } catch (err) {
            setError('Failed to upload image: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (!formData.nameEn.trim() || !formData.nameAr.trim()) {
                throw new Error('Product name is required in both English and Arabic');
            }
            const baseSku = `PRD-${Date.now()}`;
            const variants = formData.variants
                .filter(v => v.colorName?.trim() && v.sizeName?.trim())
                .map((v, index) => {
                    const skuRaw = (v.sku && String(v.sku).trim()) || '';
                    const sku = skuRaw || `${baseSku}-${index + 1}`;
                    const lowStockThreshold = (v.lowStockThreshold !== '' && v.lowStockThreshold != null) ? Math.max(0, parseInt(v.lowStockThreshold, 10)) : null;
                    return {
                        id: v.id,
                        colorName: v.colorName.trim(),
                        sizeName: v.sizeName.trim(),
                        price: v.price !== '' && v.price != null ? parseFloat(v.price) : 0,
                        stock: Math.max(0, parseInt(v.stock, 10) || 0),
                        lowStockThreshold,
                        sku
                    };
                });
            const basePrice = variants.length > 0 && variants[0].price != null
                ? variants[0].price
                : (formData.basePrice !== '' && formData.basePrice != null ? parseFloat(formData.basePrice) : 0);
            const colorImages = (formData.colorImages || []).map(ci => ({
                colorId: ci.colorId,
                colorName: (ci.colorName || '').trim() || undefined,
                images: (ci.images || []).filter(Boolean).slice(0, 8)
            })).filter(ci => ci.colorName || ci.colorId);
            const submitData = {
                name: buildLocalizedField(formData.nameEn, formData.nameAr),
                sku: formData.sku || null,
                description: (formData.descriptionEn.trim() || formData.descriptionAr.trim())
                    ? buildLocalizedField(formData.descriptionEn, formData.descriptionAr)
                    : null,
                basePrice,
                audience: formData.audience,
                categoryId: formData.categoryId ? String(formData.categoryId) : undefined,
                brandId: formData.brandId ? String(formData.brandId) : null,
                isActive: formData.isActive,
                isBestSeller: formData.isBestSeller,
                variants,
                colorImages
            };

            const saved = isEditMode
                ? await updateProduct(id, submitData)
                : await createProduct(submitData);
            const savedProductId = String(saved?.data?.id || id || '');

            try {
                const settingsRes = await fetchSettings();
                if (settingsRes?.success) {
                    const row = (settingsRes.data || []).find((s) => s.key === 'top_header_offers');
                    const parsed = row?.value ? JSON.parse(row.value) : [];
                    if (Array.isArray(parsed)) {
                        const updatedOffers = parsed.map((offer) => {
                            const currentIds = Array.isArray(offer?.productIds) ? offer.productIds.map(String) : [];
                            const selected = selectedOfferIds.includes(String(offer?.id));
                            const nextIds = selected
                                ? Array.from(new Set([...currentIds, savedProductId]))
                                : currentIds.filter((pid) => pid !== savedProductId);
                            return { ...offer, productIds: nextIds };
                        });
                        await updateSetting('top_header_offers', JSON.stringify(updatedOffers));
                    }
                }
            } catch (syncErr) {
                console.error('Failed to sync product offer mapping:', syncErr);
            }
            navigate(`/${audience.toLowerCase()}/products`, { state: { refreshList: true } });
        } catch (err) {
            const msg = err?.message || (err?.response?.data?.message) || 'An error occurred. If you see 409, the SKU is likely already in use—use a unique code.';
            setError(msg);
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(`/${audience.toLowerCase()}/products`)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                    {isEditMode ? 'Edit Product' : 'Add New Product'} - {audience}
                </h1>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                {/* Basic Information */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Product Name (English) *
                            </label>
                            <input
                                type="text"
                                name="nameEn"
                                value={formData.nameEn}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="e.g. Kids T-Shirt"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Product Name (Arabic) *
                            </label>
                            <input
                                type="text"
                                name="nameAr"
                                value={formData.nameAr}
                                onChange={handleChange}
                                dir="rtl"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="مثال: تيشيرت أطفال"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Brand
                            </label>
                            <select
                                name="brandId"
                                value={formData.brandId}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                <option value="">Select a brand</option>
                                {brands.map(brand => (
                                    <option key={brand.id} value={brand.id}>{parseLocalizedField(brand.name).en}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category *
                            </label>
                            <select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            >
                                <option value="">Select a category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{parseLocalizedField(cat.name).en}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Product SKU *
                            </label>
                            <input
                                type="text"
                                name="sku"
                                value={formData.sku}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                placeholder="e.g. PRD-001"
                            />
                        </div>

                        {formData.variants.length === 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stock (without variants)</label>
                                <input type="number" name="stock" value={formData.stock} onChange={handleChange} min="0" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                            </div>
                        )}

                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description (English)
                                </label>
                                <textarea
                                    name="descriptionEn"
                                    value={formData.descriptionEn}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="Product description..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description (Arabic)
                                </label>
                                <textarea
                                    name="descriptionAr"
                                    value={formData.descriptionAr}
                                    onChange={handleChange}
                                    rows="3"
                                    dir="rtl"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    placeholder="وصف المنتج..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Variants: price and stock per color/size – first variant = base */}
                <div>
                    <h3 className="text-lg font-semibold mb-2">Price and stock by color and size (Variants)</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Add a row for each combination (color + size). The first variant in the list is the base product.
                        <span className="block mt-1 text-indigo-600 font-medium">
                            Current category currency: {categoryCurrencyCode} (1 {categoryCurrencyCode} = {categoryExchangeRateToEgp} EGP)
                        </span>
                    </p>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600 w-10">#</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Color</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Size</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Price ({categoryCurrencyCode})</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Stock</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Low stock at</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">SKU (unique, or leave for auto)</th>
                                    <th className="px-3 py-2 w-10" />
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {formData.variants.map((v, index) => (
                                    <tr key={index} className={index === 0 ? 'bg-amber-50/50' : ''}>
                                        <td className="px-3 py-2">
                                            {index === 0 ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Base</span>
                                            ) : (
                                                <span className="text-gray-400 text-sm">{index + 1}</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2">
                                            <ColorAutocomplete value={v.colorName} onChange={(val) => updateVariant(index, 'colorName', val)} placeholder="e.g. Red" />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input type="text" value={v.sizeName} onChange={(e) => updateVariant(index, 'sizeName', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" placeholder="M" />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input type="number" step="0.01" min="0" value={v.price} onChange={(e) => updateVariant(index, 'price', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" placeholder="0" />
                                            <div className="mt-1 text-[11px] text-emerald-700">
                                                {toEgp(v.price) != null ? `≈ ${toEgp(v.price).toFixed(2)} EGP` : '—'}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <input type="number" min="0" value={v.stock} onChange={(e) => updateVariant(index, 'stock', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" placeholder="0" />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input type="number" min="0" value={v.lowStockThreshold ?? ''} onChange={(e) => updateVariant(index, 'lowStockThreshold', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" placeholder="5" title="Alert when stock ≤ this (empty = default 5)" />
                                        </td>
                                        <td className="px-3 py-2">
                                            <input type="text" value={v.sku} onChange={(e) => updateVariant(index, 'sku', e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-sm" placeholder="KID-RED-M" />
                                        </td>
                                        <td className="px-3 py-2 flex items-center gap-1">
                                            <button type="button" onClick={() => openEditVariant(index)} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded" title="تعديل الفارينت">
                                                <Edit2 size={18} />
                                            </button>
                                            <button type="button" onClick={() => removeVariant(index)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="حذف">
                                                <X size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button type="button" onClick={addVariant} className="mt-2 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm">
                        <Plus size={18} /> Add variant (color + size)
                    </button>

                    {/* Modal: تعديل الفارينت */}
                    {editingVariantIndex != null && editVariantForm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={cancelEditVariant}>
                            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
                                <h3 className="text-lg font-semibold mb-4">تعديل الفارينت</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">اللون</label>
                                        <ColorAutocomplete
                                            value={editVariantForm.colorName}
                                            onChange={(val) => setEditVariantForm(prev => ({ ...prev, colorName: val }))}
                                            placeholder="مثال: Red"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">الحجم</label>
                                        <input
                                            type="text"
                                            value={editVariantForm.sizeName}
                                            onChange={(e) => setEditVariantForm(prev => ({ ...prev, sizeName: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            placeholder="M"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">السعر ({categoryCurrencyCode})</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={editVariantForm.price}
                                            onChange={(e) => setEditVariantForm(prev => ({ ...prev, price: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                        <p className="mt-1 text-xs text-emerald-700">
                                            {toEgp(editVariantForm.price) != null ? `≈ ${toEgp(editVariantForm.price).toFixed(2)} EGP` : '—'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">المخزون</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={editVariantForm.stock}
                                            onChange={(e) => setEditVariantForm(prev => ({ ...prev, stock: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">تنبيه عند مخزون أقل من (اختياري)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={editVariantForm.lowStockThreshold}
                                            onChange={(e) => setEditVariantForm(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            placeholder="5"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">SKU (اختياري)</label>
                                        <input
                                            type="text"
                                            value={editVariantForm.sku}
                                            onChange={(e) => setEditVariantForm(prev => ({ ...prev, sku: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                            placeholder="KID-RED-M"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-6">
                                    <button type="button" onClick={saveEditVariant} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">
                                        حفظ
                                    </button>
                                    <button type="button" onClick={cancelEditVariant} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Images per color (max 8) – ProductColorImage */}
                <div>
                    <h3 className="text-lg font-semibold mb-2">Images per color (max 8)</h3>
                    <p className="text-sm text-gray-500 mb-4">Pick a color from the Variants above and upload up to 8 images for it.</p>
                    <div className="space-y-4">
                        {formData.colorImages.map((ci, colorIndex) => (
                            <div key={colorIndex} className="p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-gray-700">Color: {ci.colorName || '(no name)'}</span>
                                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, colorImages: prev.colorImages.filter((_, i) => i !== colorIndex) }))} className="text-red-600 hover:bg-red-50 p-1 rounded">
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(ci.images || []).map((img, imgIdx) => img ? (
                                        <div key={imgIdx} className="relative group">
                                            <img src={getSafeImageUrl(img)} alt="" className="w-16 h-16 object-cover rounded border border-gray-200" />
                                            <button type="button" onClick={() => removeColorImageUrl(colorIndex, imgIdx)} className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ) : null)}
                                    {((ci.images || []).filter(Boolean).length) < 8 && (
                                        <label className="flex flex-col items-center justify-center w-16 h-16 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-blue-500 transition-colors">
                                            {uploading ? <Loader className="animate-spin text-gray-400" size={18} /> : <Upload size={18} className="text-gray-400" />}
                                            <input type="file" accept="image/*" className="hidden" onChange={(ev) => handleColorImageUpload(colorIndex, ev)} disabled={uploading} />
                                        </label>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div className="flex flex-wrap gap-2 items-center">
                            {(() => {
                                const variantColors = [...new Set(
                                    formData.variants.map(v => (v.colorName || '').trim()).filter(Boolean)
                                )].sort();
                                const alreadyAdded = formData.colorImages.map(ci => (ci.colorName || '').trim()).filter(Boolean);
                                const availableColors = variantColors.filter(c => !alreadyAdded.includes(c));
                                return (
                                    <>
                                        <select
                                            value={newColorNameForImages}
                                            onChange={(e) => setNewColorNameForImages(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[180px]"
                                        >
                                            <option value="">Choose a color from Variants</option>
                                            {availableColors.map(color => (
                                                <option key={color} value={color}>{color}</option>
                                            ))}
                                            {availableColors.length === 0 && variantColors.length > 0 && (
                                                <option value="" disabled>All colors added</option>
                                            )}
                                            {variantColors.length === 0 && (
                                                <option value="" disabled>Add a color in the Variants table first</option>
                                            )}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => { addColorImageEntry(newColorNameForImages); setNewColorNameForImages(''); }}
                                            disabled={!newColorNameForImages?.trim()}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Plus size={18} className="inline" /> Add color for images
                                        </button>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>

                {/* Product Status Checkboxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700 select-none">
                            Product is Active
                        </label>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isBestSeller"
                            name="isBestSeller"
                            checked={formData.isBestSeller}
                            onChange={handleChange}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <label htmlFor="isBestSeller" className="text-sm font-medium text-gray-700 select-none">
                            Mark as Best Seller ⭐
                        </label>
                    </div>
                </div>

                {/* Offer Mapping */}
                <div>
                    <h3 className="text-lg font-semibold mb-2">Top Header Offers</h3>
                    <p className="text-sm text-gray-500 mb-3">Select offer names to attach this product to them.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {offers.filter((o) => o.isActive).map((offer) => (
                            <label key={offer.id} className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg">
                                <input
                                    type="checkbox"
                                    checked={selectedOfferIds.includes(offer.id)}
                                    onChange={(e) => {
                                        setSelectedOfferIds((prev) => e.target.checked
                                            ? Array.from(new Set([...prev, offer.id]))
                                            : prev.filter((id) => id !== offer.id));
                                    }}
                                />
                                <span className="text-sm text-gray-700">{offer.title}</span>
                            </label>
                        ))}
                    </div>
                    {offers.filter((o) => o.isActive).length === 0 && (
                        <p className="text-sm text-amber-600">No active offers found. Add offers from Home Settings first.</p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => navigate(`/${audience.toLowerCase()}/products`)}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading || uploading}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                        {isEditMode ? 'Update' : 'Create'} Product
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
