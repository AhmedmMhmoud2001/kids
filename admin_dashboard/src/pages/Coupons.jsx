import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, Percent, Calendar, X, Loader2 } from 'lucide-react';
import couponsApi from '../api/coupons';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { tx } from '../i18n/text';

const Coupons = () => {
    const { t } = useLanguage();
    const { isDark } = useTheme();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        type: 'PERCENT', // PERCENT or FIXED
        value: '',
        minOrderAmount: '',
        maxDiscount: '',
        usageLimit: '',
        expiresAt: '',
        isActive: true,
    });

    useEffect(() => {
        loadCoupons();
    }, []);

    const loadCoupons = async () => {
        try {
            setLoading(true);
            const response = await couponsApi.getAll();
            if (response.success) {
                setCoupons(response.data);
            } else {
                setError(response.message || t(tx('Failed to load coupons', 'فشل تحميل الكوبونات')));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (coupon = null) => {
        if (coupon) {
            setEditingCoupon(coupon);
            setFormData({
                code: coupon.code || '',
                type: coupon.type || 'PERCENT',
                value: coupon.value?.toString() || '',
                minOrderAmount: coupon.minOrderAmount?.toString() || '',
                maxDiscount: coupon.maxDiscount?.toString() || '',
                usageLimit: coupon.usageLimit?.toString() || '',
                expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 16) : '',
                isActive: coupon.isActive ?? true,
            });
        } else {
            setEditingCoupon(null);
            setFormData({
                code: '',
                type: 'PERCENT',
                value: '',
                minOrderAmount: '',
                maxDiscount: '',
                usageLimit: '',
                expiresAt: '',
                isActive: true,
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCoupon(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            code: formData.code.trim(),
            type: formData.type,
            value: Number(formData.value) || 0,
            minOrderAmount: formData.minOrderAmount ? Number(formData.minOrderAmount) : null,
            maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
            usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
            expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
            isActive: formData.isActive,
        };

        try {
            let response;
            if (editingCoupon) {
                response = await couponsApi.update(editingCoupon.id, payload);
            } else {
                response = await couponsApi.create(payload);
            }

            if (response.success) {
                await loadCoupons();
                handleCloseModal();
            } else {
                alert(response.message || t(tx('Failed to save coupon', 'فشل حفظ الكوبون')));
            }
        } catch (err) {
            console.error(err);
            alert(`${t(tx('Error saving coupon', 'خطأ أثناء حفظ الكوبون'))}: ${err.message}`);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(t(tx('Are you sure you want to delete this coupon?', 'هل أنت متأكد من حذف هذا الكوبون؟')))) return;
        try {
            const response = await couponsApi.delete(id);
            if (response.success) {
                setCoupons(prev => prev.filter(c => c.id !== id));
            } else {
                alert(response.message || t(tx('Failed to delete coupon', 'فشل حذف الكوبون')));
            }
        } catch (err) {
            console.error(err);
            alert(`${t(tx('Error deleting coupon', 'خطأ أثناء حذف الكوبون'))}: ${err.message}`);
        }
    };

    const filteredCoupons = coupons.filter(coupon =>
        coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                <p className="text-gray-500 font-medium">{t(tx('Loading coupons...', 'جاري تحميل الكوبونات...'))}</p>
            </div>
        );
    }

    if (error) {
        return <div className="p-4 text-center text-red-600">{t(tx('Error', 'خطأ'))}: {error}</div>;
    }

    return (
        <div className="space-y-6 overflow-x-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Percent className="text-blue-600" />
                        {t(tx('Coupons', 'الكوبونات'))}
                    </h1>
                    <p className="text-sm md:text-base text-gray-600 mt-1">
                        {t(tx('Manage discount coupons for orders and products', 'إدارة كوبونات الخصم للطلبات والمنتجات'))}
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95 font-bold whitespace-nowrap"
                >
                    <Plus size={20} />
                    {t(tx('Add New Coupon', 'إضافة كوبون جديد'))}
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder={t(tx('Search by coupon code...', 'ابحث برمز الكوبون...'))}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">{t(tx('Code', 'الرمز'))}</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">{t(tx('Type', 'النوع'))}</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">{t(tx('Value', 'القيمة'))}</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">{t(tx('Min Order', 'الحد الأدنى للطلب'))}</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">{t(tx('Max Discount', 'الحد الأقصى للخصم'))}</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">{t(tx('Usage', 'الاستخدام'))}</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">{t(tx('Expires', 'ينتهي'))}</th>
                            <th className="px-4 py-3 text-left font-semibold text-gray-600">{t(tx('Status', 'الحالة'))}</th>
                            <th className="px-4 py-3 text-right font-semibold text-gray-600">{t(tx('Actions', 'الإجراءات'))}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredCoupons.map((coupon) => (
                            <tr key={coupon.id} className={`hover:${isDark ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                <td className="px-4 py-3 font-semibold text-gray-900">{coupon.code}</td>
                                <td className="px-4 py-3">
                                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                                        {coupon.type === 'PERCENT' ? t(tx('Percentage %', 'نسبة %')) : t(tx('Fixed Value', 'قيمة ثابتة'))}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-800">
                                    {coupon.type === 'PERCENT'
                                        ? `${coupon.value}%`
                                        : `${coupon.value} EGP`}
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                    {coupon.minOrderAmount ? `${coupon.minOrderAmount} EGP` : '-'}
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                    {coupon.maxDiscount ? `${coupon.maxDiscount} EGP` : '-'}
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                    {coupon.usageCount ?? 0}
                                    {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ' / ∞'}
                                </td>
                                <td className="px-4 py-3 text-gray-700">
                                    {coupon.expiresAt
                                        ? new Date(coupon.expiresAt).toLocaleDateString()
                                        : t(tx('No Expiration', 'بدون تاريخ انتهاء'))}
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`px-2 py-1 text-xs font-bold rounded-full ${coupon.isActive
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-red-100 text-red-700'
                                            }`}
                                    >
                                        {coupon.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                                    <button
                                        onClick={() => handleOpenModal(coupon)}
                                        className="inline-flex items-center justify-center p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(coupon.id)}
                                        className="inline-flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}

                        {filteredCoupons.length === 0 && (
                            <tr>
                                <td colSpan="9" className="px-4 py-10 text-center text-gray-500">
                                    No coupons found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-1000 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70 sticky top-0 z-10">
                            <h2 className="text-xl md:text-2xl font-black text-slate-900">
                                {editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
                            </h2>
                            <button
                                onClick={handleCloseModal}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X size={22} className="text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                        Coupon Code
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                code: e.target.value.toUpperCase(),
                                            })
                                        }
                                        placeholder="Example: KIDS10"
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-bold tracking-wide"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                        Discount Type
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) =>
                                            setFormData({ ...formData, type: e.target.value })
                                        }
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                    >
                                        <option value="PERCENT">Percentage (%)</option>
                                        <option value="FIXED">Fixed Value</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                        Discount Value
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.value}
                                        onChange={(e) =>
                                            setFormData({ ...formData, value: e.target.value })
                                        }
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                    />
                                    <p className="mt-1 text-[11px] text-gray-400">
                                        If type is percentage, enter 10 for 10%
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                        Min Order Amount
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.minOrderAmount}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                minOrderAmount: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                        placeholder="Optional"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                        Max Discount
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.maxDiscount}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                maxDiscount: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                        Usage Limit
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.usageLimit}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                usageLimit: e.target.value,
                                            })
                                        }
                                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                        placeholder="Leave empty for unlimited"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                        Expiration Date
                                    </label>
                                    <div className="relative">
                                        <Calendar
                                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            size={18}
                                        />
                                        <input
                                            type="datetime-local"
                                            value={formData.expiresAt}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    expiresAt: e.target.value,
                                                })
                                            }
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                    <p className="mt-1 text-[11px] text-gray-400">
                                        Leave empty if coupon has no expiration date
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-blue-50/50 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="coupon-active"
                                    checked={formData.isActive}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            isActive: e.target.checked,
                                        })
                                    }
                                    className="w-5 h-5 text-blue-600 rounded-lg focus:ring-blue-500 border-gray-300"
                                />
                                <label
                                    htmlFor="coupon-active"
                                    className="text-sm text-slate-700 font-bold cursor-pointer"
                                >
                                    Activate coupon now
                                </label>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 md:pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="order-2 sm:order-1 flex-1 px-6 py-3 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 font-black uppercase tracking-widest text-[10px] md:text-xs transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="order-1 sm:order-2 flex-1 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl active:scale-95 transition-all"
                                >
                                    {editingCoupon ? 'Save Changes' : 'Save Coupon'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Coupons;


