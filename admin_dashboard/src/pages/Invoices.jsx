import React, { useState, useEffect } from 'react';
import { Eye, Search, Filter, FileText, Printer } from 'lucide-react';
import { fetchOrders } from '../api/orders';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { tx } from '../i18n/text';

const Invoices = () => {
    const { t } = useLanguage();
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [audienceFilter, setAudienceFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        loadOrders();
    }, [audienceFilter]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await fetchOrders(audienceFilter === 'ALL' ? null : audienceFilter);
            if (response.success) {
                setOrders(response.data);
            } else {
                setError(t(tx('Failed to load invoices', 'فشل تحميل الفواتير')));
            }
        } catch (err) {
            setError(err.message || t(tx('An error occurred', 'حدث خطأ')));
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'PAID': return 'bg-green-100 text-green-800';
            case 'CONFIRMED': return 'bg-emerald-100 text-emerald-800';
            case 'SHIPPED': return 'bg-purple-100 text-purple-800';
            case 'DELIVERED': return 'bg-blue-100 text-blue-800';
            case 'CANCELED': return 'bg-red-100 text-red-800';
            case 'RETURNED': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.id.toString().includes(searchTerm) ||
            (order.user && (
                order.user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.user.email?.toLowerCase().includes(searchTerm.toLowerCase())
            ));
        const matchesStatus = statusFilter === '' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) return <div className="p-8 text-center">{t(tx('Loading invoices...', 'جاري تحميل الفواتير...'))}</div>;
    if (error) return <div className="p-8 text-center text-red-600">{t(tx('Error', 'خطأ'))}: {error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{t(tx('Invoices Management', 'إدارة الفواتير'))}</h1>
                    <p className="text-sm md:text-base text-gray-600 mt-1">{t(tx('View and manage all system invoices', 'عرض وإدارة كل فواتير النظام'))}</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                    <Filter size={18} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{t(tx('Scope:', 'النطاق:'))}</span>
                    <select
                        value={audienceFilter}
                        onChange={(e) => setAudienceFilter(e.target.value)}
                        className="text-sm border-none focus:ring-0 cursor-pointer font-bold text-blue-600 outline-none"
                    >
                        <option value="ALL">{t(tx('All Invoices', 'كل الفواتير'))}</option>
                        <option value="KIDS">{t(tx('Kids Audience', 'فئة كيدز'))}</option>
                        <option value="NEXT">{t(tx('Next Audience', 'فئة نكست'))}</option>
                    </select>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder={t(tx('Search by invoice ID, customer name, or email...', 'ابحث برقم الفاتورة أو اسم العميل أو البريد الإلكتروني...'))}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{t(tx('Status:', 'الحالة:'))}</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                        >
                            <option value="">{t(tx('All Status', 'كل الحالات'))}</option>
                            <option value="PENDING">{t(tx('Pending', 'قيد الانتظار'))}</option>
                            <option value="PAID">{t(tx('Paid', 'مدفوع'))}</option>
                            <option value="CONFIRMED">{t(tx('Confirmed', 'مؤكد'))}</option>
                            <option value="SHIPPED">{t(tx('Shipped', 'تم الشحن'))}</option>
                            <option value="DELIVERED">{t(tx('Delivered', 'تم التسليم'))}</option>
                            <option value="CANCELED">{t(tx('Canceled', 'ملغي'))}</option>
                            <option value="RETURNED">{t(tx('Returned', 'مرتجع'))}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto modern-scrollbar">
                    <table className="w-full text-left min-w-[900px]">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>

                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">{t(tx('Customer', 'العميل'))}</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">{t(tx('Date', 'التاريخ'))}</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">{t(tx('Items', 'العناصر'))}</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">{t(tx('Amount', 'المبلغ'))}</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600">{t(tx('Status', 'الحالة'))}</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">{t(tx('Actions', 'الإجراءات'))}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        <FileText size={48} className="mx-auto mb-3 text-gray-300" />
                                        <p className="text-lg font-medium">{t(tx('No invoices found', 'لا توجد فواتير'))}</p>
                                        <p className="text-sm">{t(tx('Try adjusting your filters', 'جرّب تعديل الفلاتر'))}</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className={`hover:${isDark ? 'bg-slate-800' : 'bg-gray-50'} transition-colors`}>

                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {t(order.user?.firstName)} {t(order.user?.lastName)}
                                            </div>
                                            <div className="text-xs text-gray-500">{order.user?.email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {order.items?.length || 0} {t(tx('items', 'عنصر'))}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-blue-600">
                                            {parseFloat(order.totalAmount).toFixed(2)} EGP
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/invoices/${order.id}`)}
                                                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    <Eye size={16} />
                                                    {t(tx('View', 'عرض'))}
                                                </button>

                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                    <div className="text-sm text-gray-600 mb-1">{t(tx('Total Invoices', 'إجمالي الفواتير'))}</div>
                    <div className="text-2xl font-bold text-gray-900">{filteredOrders.length}</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                    <div className="text-sm text-gray-600 mb-1">{t(tx('Total Revenue', 'إجمالي الإيرادات'))}</div>
                    <div className="text-2xl font-bold text-green-600">
                        {filteredOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0).toFixed(2)} EGP
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                    <div className="text-sm text-gray-600 mb-1">{t(tx('Pending', 'قيد الانتظار'))}</div>
                    <div className="text-2xl font-bold text-yellow-600">
                        {filteredOrders.filter(o => o.status === 'PENDING').length}
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                    <div className="text-sm text-gray-600 mb-1">{t(tx('Delivered', 'تم التسليم'))}</div>
                    <div className="text-2xl font-bold text-blue-600">
                        {filteredOrders.filter(o => o.status === 'DELIVERED').length}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Invoices;
