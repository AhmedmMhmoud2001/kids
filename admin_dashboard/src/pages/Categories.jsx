import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/useApp';
import { fetchCategories, deleteCategory } from '../api/categories';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { tx } from '../i18n/text';

const Categories = () => {
    const { t } = useLanguage();
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const { user } = useApp();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    // Initialize audience filter based on role directly
    const [audienceFilter, setAudienceFilter] = useState(() => {
        if (user?.role === 'ADMIN_KIDS') return 'KIDS';
        if (user?.role === 'ADMIN_NEXT') return 'NEXT';
        return '';
    });

    useEffect(() => {
        loadCategories();
    }, [audienceFilter, user?.role]);

    const loadCategories = async () => {
        try {
            setLoading(true);

            // Safety: Force strict audience for restricted roles
            let currentFilter = audienceFilter;
            if (user?.role === 'ADMIN_KIDS') currentFilter = 'KIDS';
            if (user?.role === 'ADMIN_NEXT') currentFilter = 'NEXT';

            const response = await fetchCategories(currentFilter || null);
            if (response.success) {
                // Double Safety: Frontend filter just in case the backend returns more
                let data = response.data;
                if (user?.role === 'ADMIN_KIDS') {
                    data = data.filter(cat => cat.audience === 'KIDS');
                } else if (user?.role === 'ADMIN_NEXT') {
                    data = data.filter(cat => cat.audience === 'NEXT');
                }
                setCategories(data);
            } else {
                setError(t(tx('Failed to load categories', 'فشل تحميل الأقسام')));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t(tx(
            'Are you sure you want to delete this category? All products inside it will also be permanently deleted.',
            'هل أنت متأكد من حذف هذا القسم؟ سيتم حذف جميع المنتجات الموجودة بداخله نهائياً.'
        )))) {
            try {
                const response = await deleteCategory(id);
                if (response.success) {
                    setCategories(categories.filter(cat => cat.id !== id));
                } else {
                    alert(t(tx('Failed to delete category', 'فشل حذف القسم')));
                }
            } catch (err) {
                console.error(err);
                alert(t(tx('Error deleting category', 'خطأ أثناء حذف القسم')));
            }
        }
    };

    const filteredCategories = categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-4 text-center">{t(tx('Loading categories...', 'جاري تحميل الأقسام...'))}</div>;
    if (error) return <div className="p-4 text-center text-red-600">{t(tx('Error', 'خطأ'))}: {error}</div>;

    const isSystemAdmin = user?.role === 'SYSTEM_ADMIN';

    return (
        <div className="space-y-6 overflow-x-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{t(tx('Categories', 'الأقسام'))}</h1>
                    <p className="text-sm md:text-base text-gray-600 mt-1">
                        {isSystemAdmin
                            ? t(tx('Manage categories for Kids and Next audiences', 'إدارة أقسام كيدز ونكست'))
                            : t(tx(`Manage categories for ${user?.role === 'ADMIN_KIDS' ? 'Kids' : 'Next'} audience`, `إدارة الأقسام لفئة ${user?.role === 'ADMIN_KIDS' ? 'كيدز' : 'نكست'}`))}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/categories/new')}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                    <Plus size={20} />
                    {t(tx('Add Category', 'إضافة قسم'))}
                </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder={t(tx('Search categories...', 'ابحث في الأقسام...'))}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {isSystemAdmin && (
                        <select
                            value={audienceFilter}
                            onChange={(e) => setAudienceFilter(e.target.value)}
                            className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">{t(tx('All Audiences', 'كل الفئات'))}</option>
                            <option value="KIDS">{t(tx('Kids', 'كيدز'))}</option>
                            <option value="NEXT">{t(tx('Next', 'نكست'))}</option>
                        </select>
                    )}
                </div>
            </div>

            {/* Categories Table */}
            <div className="bg-white rounded-lg shadow-sm">
                <div className="overflow-x-auto modern-scrollbar">
                    <table className="w-full min-w-[800px]">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>

                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t(tx('Image', 'الصورة'))}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t(tx('Sort Order', 'ترتيب العرض'))}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t(tx('Name', 'الاسم'))}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t(tx('Slug', 'المعرف المختصر'))}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t(tx('Audience', 'الفئة'))}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t(tx('Currency', 'العملة'))}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t(tx('Rate to EGP', 'سعر التحويل للجنيه'))}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t(tx('Status', 'الحالة'))}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t(tx('Products', 'المنتجات'))}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t(tx('Created At', 'تاريخ الإنشاء'))}
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t(tx('Actions', 'الإجراءات'))}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredCategories.map((category) => (
                                <tr key={category.id} className={`hover:${isDark ? 'bg-slate-800' : 'bg-gray-50'} transition-colors`}>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {category.image ? (
                                            <img src={category.image} alt={category.name} className="h-10 w-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                                <span className="text-xs">{t(tx('No Img', 'لا توجد صورة'))}</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{category.sortOrder !== undefined ? category.sortOrder : 0}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{t(category.name)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{category.slug}</code>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${category.audience === 'KIDS'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-purple-100 text-purple-800'
                                            }`}>
                                            {category.audience}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                                            {category.currencyCode || 'EGP'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {Number(category.exchangeRateToEgp || 1).toFixed(4)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${category.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {category.isActive ? t(tx('Active', 'نشط')) : t(tx('Inactive', 'غير نشط'))}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {category._count?.products || 0} {t(tx('products', 'منتج'))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(category.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => navigate(`/categories/${category.id}/edit`)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                    <div className="text-xs md:text-sm text-gray-600">Total Categories</div>
                    <div className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{categories.length}</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                    <div className="text-xs md:text-sm text-gray-600">Active Categories</div>
                    <div className="text-xl md:text-2xl font-bold text-green-600 mt-1">
                        {categories.filter(c => c.isActive).length}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Categories;
