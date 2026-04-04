import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Upload, X, Loader2 } from 'lucide-react';
import brandsApi from '../api/brands';
import { uploadImage, uploadBrandImage } from '../api/upload';
import { useApp } from '../context/useApp';
import { useLanguage } from '../context/LanguageContext';
import { tx } from '../i18n/text';
import { parseLocalizedField, buildLocalizedField } from '../utils/localizedField';

const Brands = () => {
    const { t } = useLanguage();
    const { user } = useApp();
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [formData, setFormData] = useState({
        nameEn: '',
        nameAr: '',
        slug: '',
        image: '',
        descriptionEn: '',
        descriptionAr: '',
        isActive: true
    });

    useEffect(() => {
        loadBrands();
    }, []);

    const loadBrands = async () => {
        try {
            setLoading(true);
            const response = await brandsApi.getAll();
            if (response.success) {
                setBrands(response.data);
            } else {
                setError(t(tx('Failed to load brands', 'فشل تحميل العلامات التجارية')));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (brand = null) => {
        if (brand) {
            setEditingBrand(brand);
            const localizedName = parseLocalizedField(brand.name);
            const localizedDescription = parseLocalizedField(brand.description || '');
            setFormData({
                nameEn: localizedName.en,
                nameAr: localizedName.ar,
                slug: brand.slug,
                image: brand.image || '',
                descriptionEn: localizedDescription.en,
                descriptionAr: localizedDescription.ar,
                isActive: brand.isActive
            });
        } else {
            setEditingBrand(null);
            setFormData({
                nameEn: '',
                nameAr: '',
                slug: '',
                image: '',
                descriptionEn: '',
                descriptionAr: '',
                isActive: true
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBrand(null);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            const result = await uploadBrandImage(file);
            setFormData(prev => ({ ...prev, image: result.url }));
        } catch (err) {
            alert(`${t(tx('Failed to upload image', 'فشل رفع الصورة'))}: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (!formData.nameEn.trim() || !formData.nameAr.trim()) {
                alert(t(tx('Brand name is required in both English and Arabic', 'اسم العلامة مطلوب بالإنجليزية والعربية')));
                return;
            }

            const payload = {
                ...formData,
                name: buildLocalizedField(formData.nameEn, formData.nameAr),
                description: (formData.descriptionEn.trim() || formData.descriptionAr.trim())
                    ? buildLocalizedField(formData.descriptionEn, formData.descriptionAr)
                    : ''
            };
            delete payload.nameEn;
            delete payload.nameAr;
            delete payload.descriptionEn;
            delete payload.descriptionAr;

            let response;
            if (editingBrand) {
                response = await brandsApi.update(editingBrand.id, payload);
            } else {
                response = await brandsApi.create(payload);
            }

            if (response.success) {
                loadBrands();
                handleCloseModal();
            } else {
                alert(response.message || t(tx('Failed to save brand', 'فشل حفظ العلامة')));
            }
        } catch (err) {
            console.error(err);
            alert(t(tx('Error saving brand', 'خطأ أثناء حفظ العلامة')));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t(tx('Are you sure you want to delete this brand?', 'هل أنت متأكد من حذف هذه العلامة؟')))) {
            try {
                const response = await brandsApi.delete(id);
                if (response.success) {
                    setBrands(brands.filter(b => b.id !== id));
                } else {
                    alert(t(tx('Failed to delete brand', 'فشل حذف العلامة')));
                }
            } catch (err) {
                console.error(err);
                alert(t(tx('Error deleting brand', 'خطأ أثناء حذف العلامة')));
            }
        }
    };

    const filteredBrands = brands.filter((brand) => {
        const localizedName = parseLocalizedField(brand.name);
        const query = searchTerm.toLowerCase();
        return localizedName.en.toLowerCase().includes(query) || localizedName.ar.toLowerCase().includes(query);
    });

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                <p className="text-gray-500 font-medium">{t(tx('Loading brands...', 'جاري تحميل العلامات...'))}</p>
        </div>
    );

    if (error) return <div className="p-4 text-center text-red-600">{t(tx('Error', 'خطأ'))}: {error}</div>;

    return (
        <div className="space-y-6 overflow-x-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{t(tx('Our Brands', 'العلامات التجارية'))}</h1>
                    <p className="text-sm md:text-base text-gray-600 mt-1">{t(tx('Manage symbols of quality and trust', 'إدارة رموز الجودة والثقة'))}</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 font-bold whitespace-nowrap"
                >
                    <Plus size={20} />
                    {t(tx('Add New Brand', 'إضافة علامة جديدة'))}
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder={t(tx('Search by brand name...', 'ابحث باسم العلامة...'))}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                {filteredBrands.map((brand) => (
                    <div key={brand.id} className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-xl transition-all group">
                        <div className="h-48 bg-gray-50 flex items-center justify-center p-8 relative">
                            {brand.image ? (
                                <img src={brand.image} alt={t(brand.name)} className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="text-gray-300 font-black text-4xl select-none">{t(brand.name).substring(0, 2).toUpperCase()}</div>
                            )}
                            <div className="absolute top-4 right-4">
                                <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider ${brand.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    {brand.isActive ? t(tx('Active', 'نشط')) : t(tx('Inactive', 'غير نشط'))}
                                </span>
                            </div>
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900">{t(brand.name)}</h3>
                            <p className="text-sm text-gray-400 font-medium mt-1">/{brand.slug}</p>
                            {brand.description && (
                                <p className="text-sm text-gray-600 mt-4 line-clamp-2 leading-relaxed">
                                    {t(brand.description)}
                                </p>
                            )}
                            <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-end gap-2">
                                <button
                                    onClick={() => handleOpenModal(brand)}
                                    className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                                    title={t(tx('Edit Brand', 'تعديل العلامة'))}
                                >
                                    <Edit2 size={20} />
                                </button>
                                <button
                                    onClick={() => handleDelete(brand.id)}
                                    className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                    title={t(tx('Delete Brand', 'حذف العلامة'))}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-1000 p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-in-bottom">
                        <div className="px-6 md:px-8 py-4 md:py-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">
                                {editingBrand ? t(tx('Modify Brand', 'تعديل العلامة')) : t(tx('Register Brand', 'إضافة علامة'))}
                            </h2>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X size={24} className="text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-4 md:space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t(tx('Display Name (English)', 'اسم العرض (إنجليزي)'))}</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Nike"
                                        value={formData.nameEn}
                                        onChange={(e) => setFormData({ ...formData, nameEn: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t(tx('Display Name (Arabic)', 'اسم العرض (عربي)'))}</label>
                                    <input
                                        type="text"
                                        dir="rtl"
                                        placeholder="مثال: نايك"
                                        value={formData.nameAr}
                                        onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t(tx('URL Slug', 'Slug الرابط'))}</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-gray-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Brand Identity (Logo)</label>
                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 shrink-0">
                                        {formData.image ? (
                                            <img src={formData.image} alt="Preview" className="w-full h-full object-contain" />
                                        ) : (
                                            <Upload className="text-gray-300" size={32} />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <input
                                            type="file"
                                            id="brand-logo"
                                            className="hidden"
                                            onChange={handleImageUpload}
                                            accept="image/*"
                                        />
                                        <label
                                            htmlFor="brand-logo"
                                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm cursor-pointer transition-all ${uploading ? 'bg-gray-100 text-gray-400 pointer-events-none' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                }`}
                                        >
                                            {uploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                                            {uploading ? 'Uploading...' : 'Upload Logo'}
                                        </label>
                                        <p className="text-[10px] text-gray-400 font-medium">PNG, JPG or SVG. Max 2MB.</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t(tx('Description (English)', 'الوصف (إنجليزي)'))}</label>
                                <textarea
                                    value={formData.descriptionEn}
                                    onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                                    rows={3}
                                    placeholder="Tell the story of this brand..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all leading-relaxed"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{t(tx('Description (Arabic)', 'الوصف (عربي)'))}</label>
                                <textarea
                                    value={formData.descriptionAr}
                                    onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                                    rows={3}
                                    dir="rtl"
                                    placeholder="اكتب وصف العلامة..."
                                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all leading-relaxed"
                                />
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 rounded-lg focus:ring-blue-500 border-gray-300"
                                />
                                <label htmlFor="isActive" className="text-sm text-slate-700 font-bold cursor-pointer">{t(tx('Set as Active Brand', 'تعيين كعلامة نشطة'))}</label>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 md:pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="order-2 sm:order-1 flex-1 px-6 py-3 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 font-black uppercase tracking-widest text-[10px] md:text-xs transition-all"
                                >
                                    Discard
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploading}
                                    className="order-1 sm:order-2 flex-1 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl active:scale-95 transition-all"
                                >
                                    {editingBrand ? 'Commit Changes' : 'Confirm Registration'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Brands;
