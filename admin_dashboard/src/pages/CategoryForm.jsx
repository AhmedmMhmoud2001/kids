import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/useApp';
import { fetchCategory, createCategory, updateCategory } from '../api/categories';
import { uploadImage, uploadCategoryImage } from '../api/upload';
import { ArrowLeft, Save, Loader, Upload, X } from 'lucide-react';
import { parseLocalizedField, buildLocalizedField } from '../utils/localizedField';

const CategoryForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useApp();
    const isEditMode = !!id;

    // Determine initial audience based on role
    const getInitialAudience = () => {
        if (user?.role === 'ADMIN_KIDS') return 'KIDS';
        if (user?.role === 'ADMIN_NEXT') return 'NEXT';
        return 'KIDS'; // Default for SYSTEM_ADMIN if creating new
    };

    const [formData, setFormData] = useState({
        nameEn: '',
        nameAr: '',
        slug: '',
        image: '',
        audience: getInitialAudience(),
        currencyCode: 'EGP',
        exchangeRateToEgp: 1,
        sortOrder: 0,
        isActive: true
    });

    // Update audience if user role changes or loads
    useEffect(() => {
        if (!isEditMode) {
            setFormData(prev => ({ ...prev, audience: getInitialAudience() }));
        }
    }, [user?.role]);

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditMode);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isEditMode) {
            loadCategory();
        }
    }, [id]);

    const loadCategory = async () => {
        try {
            setInitialLoading(true);
            const response = await fetchCategory(id);
            if (response.success) {
                setFormData({
                    nameEn: parseLocalizedField(response.data.name).en,
                    nameAr: parseLocalizedField(response.data.name).ar,
                    slug: response.data.slug,
                    image: response.data.image || '',
                    audience: response.data.audience,
                    currencyCode: response.data.currencyCode || 'EGP',
                    exchangeRateToEgp: Number(response.data.exchangeRateToEgp || 1),
                    sortOrder: response.data.sortOrder || 0,
                    isActive: response.data.isActive
                });
            } else {
                setError('Failed to load category details');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => {
            const next = {
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            };
            if (name === 'currencyCode' && value === 'EGP') {
                next.exchangeRateToEgp = 1;
            }
            return next;
        });

        if (name === 'nameEn' && !isEditMode) {
            const slug = value
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
            setFormData(prev => ({ ...prev, slug: slug }));
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            setError(null);
            const result = await uploadCategoryImage(file);
            setFormData(prev => ({ ...prev, image: result.url }));
        } catch (err) {
            setError('Failed to upload image: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const removeImage = () => {
        setFormData(prev => ({ ...prev, image: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (!formData.nameEn.trim() || !formData.nameAr.trim()) {
                throw new Error('Category name is required in both English and Arabic');
            }
            const payload = {
                ...formData,
                exchangeRateToEgp: Number(formData.exchangeRateToEgp) || 1,
                name: buildLocalizedField(formData.nameEn, formData.nameAr)
            };
            delete payload.nameEn;
            delete payload.nameAr;

            if (isEditMode) {
                await updateCategory(id, payload);
            } else {
                await createCategory(payload);
            }
            navigate('/categories');
        } catch (err) {
            setError(err.message);
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

    const isAudienceDisabled = isEditMode || user?.role !== 'SYSTEM_ADMIN';

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/categories')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                    {isEditMode ? 'Edit Category' : 'Add New Category'}
                </h1>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                {/* Name (Bilingual) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category Name (English)
                        </label>
                        <input
                            type="text"
                            name="nameEn"
                            value={formData.nameEn}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="e.g. Action Figures"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category Name (Arabic)
                        </label>
                        <input
                            type="text"
                            name="nameAr"
                            value={formData.nameAr}
                            onChange={handleChange}
                            dir="rtl"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="مثال: ألعاب حركة"
                        />
                    </div>
                </div>

                {/* Slug */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Slug (URL friendly)
                    </label>
                    <input
                        type="text"
                        name="slug"
                        value={formData.slug}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50"
                        placeholder="e.g. action-figures"
                    />
                </div>

                {/* Audience */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Audience *
                    </label>
                    <select
                        name="audience"
                        value={formData.audience}
                        onChange={handleChange}
                        required
                        disabled={isAudienceDisabled}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                        <option value="KIDS">Kids</option>
                        <option value="NEXT">Next</option>
                    </select>
                    {isAudienceDisabled && (
                        <p className="text-xs text-gray-500 mt-1">
                            {isEditMode ? 'Audience cannot be changed after creation' : `Manage categories specifically for ${formData.audience}`}
                        </p>
                    )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category Currency *
                        </label>
                        <select
                            name="currencyCode"
                            value={formData.currencyCode}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        >
                            <option value="EGP">Egyptian Pound (EGP)</option>
                            <option value="USD">US Dollar (USD)</option>
                            <option value="AED">UAE Dirham (AED)</option>
                            <option value="EUR">Euro (EUR)</option>
                            <option value="QAR">Qatari Riyal (QAR)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Exchange Rate to EGP *
                        </label>
                        <input
                            type="number"
                            name="exchangeRateToEgp"
                            value={formData.exchangeRateToEgp}
                            onChange={handleChange}
                            min="0.0001"
                            step="0.0001"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="e.g. 50"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Example: 1 {formData.currencyCode} = {formData.exchangeRateToEgp || 1} EGP
                        </p>
                    </div>
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category Image
                    </label>

                    {!formData.image ? (
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition-colors">
                            <div className="space-y-1 text-center">
                                {uploading ? (
                                    <Loader className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
                                ) : (
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                )}
                                <div className="flex text-sm text-gray-600 justify-center">
                                    <label
                                        htmlFor="file-upload"
                                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                                    >
                                        <span>{uploading ? 'Uploading...' : 'Upload a file'}</span>
                                        <input
                                            id="file-upload"
                                            name="file-upload"
                                            type="file"
                                            className="sr-only"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                        />
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                            </div>
                        </div>
                    ) : (
                        <div className="mt-2 relative inline-block">
                            <img
                                src={formData.image}
                                alt="Preview"
                                className="h-40 w-40 object-cover rounded-lg border border-gray-200"
                            />
                            <button
                                type="button"
                                onClick={removeImage}
                                className="absolute -top-2 -right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 shadow-sm"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Sort Order */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sort Order
                    </label>
                    <input
                        type="number"
                        name="sortOrder"
                        value={formData.sortOrder}
                        onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Lower numbers appear first.
                    </p>
                </div>

                {/* Is Active */}
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
                        Active Status
                    </label>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => navigate('/categories')}
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
                        {isEditMode ? 'Update' : 'Create'} Category
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CategoryForm;
