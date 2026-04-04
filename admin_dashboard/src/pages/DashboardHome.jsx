import React from 'react';
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    TrendingUp, TrendingDown, Users, DollarSign,
    ShoppingCart, Activity, Percent,
    Package, Folder, Tag, PlusCircle, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorState from '../components/common/ErrorState';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { tx } from '../i18n/text';

const StatCard = ({ title, value, icon, change, isDown, iconBg, isDark }) => (
    <div className={`
        rounded-xl p-4 sm:p-5 md:p-6 shadow-sm flex justify-between items-start hover:shadow-md transition-all duration-300
        ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-100'}
    `}>
        <div className="min-w-0 flex-1 mr-3">
            <p className={`text-xs sm:text-sm font-bold uppercase tracking-wider truncate ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                {title}
            </p>
            <h3 className={`text-lg sm:text-xl md:text-2xl font-black mt-1 truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {value}
            </h3>
            <div className={`flex items-center gap-1 mt-2 text-xs sm:text-sm font-bold ${isDown ? 'text-red-500' : 'text-emerald-500'}`}>
                {isDown ? <TrendingDown size={14} className="shrink-0" /> : <TrendingUp size={14} className="shrink-0" />}
                <span className="truncate">{change}</span>
            </div>
        </div>
        <div className={`p-2 sm:p-3 rounded-full ${iconBg} text-white shadow-lg shrink-0`}>
            {React.cloneElement(icon, { size: undefined, className: 'w-5 h-5 sm:w-6 sm:h-6' })}
        </div>
    </div>
);

const DashboardHome = () => {
    const { t, language } = useLanguage();
    const { isDark } = useTheme();
    const navigate = useNavigate();

    const {
        stats,
        orders,
        products,
        categories,
        brands,
        coupons,
        isLoading,
        isRefetching,
        isError,
        refetchAll
    } = useDashboardData();

    const totalRevenue = stats?.sales || 0;
    const totalOrders = stats?.activeOrders || 0;
    const activeUsers = stats?.totalUsers || 0;
    const totalProducts = products?.total ?? products?.list?.length ?? stats?.products ?? 0;
    const totalCategories = categories?.length || stats?.categories || 0;
    const totalBrands = brands?.length || stats?.brands || 0;
    const totalCoupons = coupons?.length || stats?.coupons || 0;

    const salesChartData = stats?.salesData || [];
    const ordersChartData = stats?.ordersStats || [];
    const recentOrders = orders?.slice(0, 5) || [];

    const cardBg = isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100';
    const textPrimary = isDark ? 'text-white' : 'text-gray-800';
    const textSecondary = isDark ? 'text-slate-400' : 'text-gray-500';
    const headerBg = isDark ? 'bg-slate-900' : 'bg-gradient-to-r from-blue-500 to-purple-600';

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <LoadingSpinner size="lg" text={t(tx('Loading dashboard...', 'جاري تحميل لوحة التحكم...'))} />
            </div>
        );
    }

    if (isError) {
        return (
            <ErrorState
                title={t(tx('Failed to load data', 'فشل تحميل البيانات'))}
                message={t(tx('An error occurred while loading dashboard data', 'حدث خطأ أثناء تحميل بيانات لوحة التحكم'))}
                onRetry={refetchAll}
            />
        );
    }

    return (
        <div className={`-m-4 md:-m-6 overflow-x-hidden transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
            {/* Header Section */}
            <div className={`pt-6 md:pt-10 pb-32 px-4 md:px-6 ${headerBg} relative`}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 md:mb-12">
                        <div>
                            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white leading-tight">
                                {t(tx('Dashboard Overview', 'نظرة عامة على اللوحة'))}
                            </h1>
                            <p className="text-white/70 mt-1 text-sm md:text-lg font-medium">
                                {t(tx("Monitoring your store's growth and inventory", 'متابعة نمو المتجر والمخزون'))}
                            </p>
                        </div>
                        <button
                            onClick={refetchAll}
                            disabled={isRefetching}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                        >
                            <RefreshCw size={16} className={isRefetching ? 'animate-spin' : ''} />
                            {isRefetching ? t(tx('Refreshing...', 'جاري التحديث...')) : t(tx('Refresh', 'تحديث'))}
                        </button>
                    </div>

                    {/* Primary Stat Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <StatCard
                            title={t(tx('Total Revenue', 'إجمالي الإيرادات'))}
                            value={`${totalRevenue.toFixed(2)} EGP`}
                            icon={<DollarSign size={24} />}
                            change={t(tx('8.5%+', '+8.5%'))}
                            iconBg="bg-emerald-500"
                            isDark={isDark}
                        />
                        <StatCard
                            title={t(tx('Active Orders', 'الطلبات النشطة'))}
                            value={totalOrders}
                            icon={<ShoppingCart size={24} />}
                            change={t(tx('Recent', 'حديث'))}
                            iconBg="bg-amber-500"
                            isDark={isDark}
                        />
                        <StatCard
                            title={t(tx('Customers', 'العملاء'))}
                            value={activeUsers}
                            icon={<Users size={24} />}
                            change={t(tx('Total', 'الإجمالي'))}
                            iconBg="bg-blue-500"
                            isDark={isDark}
                        />
                        <StatCard
                            title={t(tx('Products', 'المنتجات'))}
                            value={totalProducts}
                            icon={<Package size={24} />}
                            change={t(tx('Active', 'نشط'))}
                            iconBg="bg-pink-500"
                            isDark={isDark}
                        />
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="max-w-7xl mx-auto px-4 md:px-6 -mt-16 space-y-6 md:space-y-8 pb-12 relative z-10">
                {/* Secondary Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                        <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border flex items-center gap-3 sm:gap-4 ${cardBg}`}>
                            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-50'} ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className={`text-[10px] sm:text-xs font-bold uppercase truncate ${textSecondary}`}>{t(tx('Brands', 'البراندات'))}</p>
                                <p className={`text-lg sm:text-xl font-black ${textPrimary}`}>{totalBrands}</p>
                            </div>
                        </div>
                        <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border flex items-center gap-3 sm:gap-4 ${cardBg}`}>
                            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${isDark ? 'bg-orange-900/30' : 'bg-orange-50'} ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                                <Percent className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className={`text-[10px] sm:text-xs font-bold uppercase truncate ${textSecondary}`}>{t(tx('Coupons', 'الكوبونات'))}</p>
                                <p className={`text-lg sm:text-xl font-black ${textPrimary}`}>{totalCoupons}</p>
                            </div>
                        </div>
                        <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border flex items-center gap-3 sm:gap-4 ${cardBg}`}>
                            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${isDark ? 'bg-cyan-900/30' : 'bg-cyan-50'} ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                                <Folder className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className={`text-[10px] sm:text-xs font-bold uppercase truncate ${textSecondary}`}>{t(tx('Categories', 'الأقسام'))}</p>
                                <p className={`text-lg sm:text-xl font-black ${textPrimary}`}>{totalCategories}</p>
                            </div>
                        </div>
                        <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-sm border flex items-center gap-3 sm:gap-4 ${cardBg}`}>
                            <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'} ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className={`text-[10px] sm:text-xs font-bold uppercase truncate ${textSecondary}`}>{t(tx('Perf.', 'الأداء'))}</p>
                                <p className={`text-lg sm:text-xl font-black ${textPrimary}`}>100%</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className={`rounded-xl sm:rounded-2xl shadow-sm border p-4 sm:p-6 ${cardBg}`}>
                        <h2 className={`text-xs sm:text-sm font-bold uppercase tracking-widest mb-3 sm:mb-4 ${textSecondary}`}>
                            {t(tx('Quick Actions', 'إجراءات سريعة'))}
                        </h2>
                        <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-2 gap-2 sm:gap-3">
                            <button
                                onClick={() => navigate('/kids/products/new')}
                                className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg sm:rounded-xl border border-dashed transition-all gap-1 sm:gap-2 group active:scale-95
                                    ${isDark 
                                        ? 'border-slate-600 hover:border-blue-400 hover:bg-blue-900/20' 
                                        : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                                    }`}
                            >
                                <PlusCircle className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-slate-500 group-hover:text-blue-400' : 'text-gray-300 group-hover:text-blue-500'}`} />
                                <span className={`text-[8px] sm:text-[10px] font-bold uppercase ${isDark ? 'text-slate-400 group-hover:text-blue-400' : 'text-gray-500 group-hover:text-blue-600'}`}>
                                    {t(tx('Product', 'منتج'))}
                                </span>
                            </button>
                            <button
                                onClick={() => navigate('/categories/new')}
                                className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg sm:rounded-xl border border-dashed transition-all gap-1 sm:gap-2 group active:scale-95
                                    ${isDark 
                                        ? 'border-slate-600 hover:border-pink-400 hover:bg-pink-900/20' 
                                        : 'border-gray-200 hover:border-pink-400 hover:bg-pink-50'
                                    }`}
                            >
                                <Folder className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-slate-500 group-hover:text-pink-400' : 'text-gray-300 group-hover:text-pink-500'}`} />
                                <span className={`text-[8px] sm:text-[10px] font-bold uppercase ${isDark ? 'text-slate-400 group-hover:text-pink-400' : 'text-gray-500 group-hover:text-pink-600'}`}>
                                    {t(tx('Category', 'قسم'))}
                                </span>
                            </button>
                            <button
                                onClick={() => navigate('/coupons/new')}
                                className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg sm:rounded-xl border border-dashed transition-all gap-1 sm:gap-2 group active:scale-95
                                    ${isDark 
                                        ? 'border-slate-600 hover:border-amber-400 hover:bg-amber-900/20' 
                                        : 'border-gray-200 hover:border-amber-400 hover:bg-amber-50'
                                    }`}
                            >
                                <Percent className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-slate-500 group-hover:text-amber-400' : 'text-gray-300 group-hover:text-amber-500'}`} />
                                <span className={`text-[8px] sm:text-[10px] font-bold uppercase ${isDark ? 'text-slate-400 group-hover:text-amber-400' : 'text-gray-500 group-hover:text-amber-600'}`}>
                                    {t(tx('Coupon', 'كوبون'))}
                                </span>
                            </button>
                            <button
                                onClick={() => navigate('/orders')}
                                className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg sm:rounded-xl border border-dashed transition-all gap-1 sm:gap-2 group active:scale-95
                                    ${isDark 
                                        ? 'border-slate-600 hover:border-emerald-400 hover:bg-emerald-900/20' 
                                        : 'border-gray-200 hover:border-emerald-400 hover:bg-emerald-50'
                                    }`}
                            >
                                <ShoppingCart className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-slate-500 group-hover:text-emerald-400' : 'text-gray-300 group-hover:text-emerald-500'}`} />
                                <span className={`text-[8px] sm:text-[10px] font-bold uppercase ${isDark ? 'text-slate-400 group-hover:text-emerald-400' : 'text-gray-500 group-hover:text-emerald-600'}`}>
                                    {t(tx('Orders', 'طلبات'))}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sales Chart */}
                    <div className={`rounded-xl p-4 sm:p-6 shadow-sm border ${cardBg}`}>
                        <h3 className={`text-sm sm:text-base font-bold mb-4 ${textPrimary}`}>
                            {t(tx('Revenue Overview', 'نظرة عامة على الإيرادات'))}
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesChartData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#5DA5F9" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#5DA5F9" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#E5E7EB'} />
                                    <XAxis dataKey="name" tick={{fill: isDark ? '#94A3B8' : '#6B7280', fontSize: 12}} />
                                    <YAxis tick={{fill: isDark ? '#94A3B8' : '#6B7280', fontSize: 12}} />
                                    <Tooltip 
                                        contentStyle={{
                                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                            border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`,
                                            borderRadius: '8px',
                                            color: isDark ? '#F1F5F9' : '#1F2937'
                                        }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#5DA5F9" strokeWidth={2} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Orders Chart */}
                    <div className={`rounded-xl p-4 sm:p-6 shadow-sm border ${cardBg}`}>
                        <h3 className={`text-sm sm:text-base font-bold mb-4 ${textPrimary}`}>
                            {t(tx('Orders Overview', 'نظرة عامة على الطلبات'))}
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ordersChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#E5E7EB'} />
                                    <XAxis dataKey="name" tick={{fill: isDark ? '#94A3B8' : '#6B7280', fontSize: 12}} />
                                    <YAxis tick={{fill: isDark ? '#94A3B8' : '#6B7280', fontSize: 12}} />
                                    <Tooltip 
                                        contentStyle={{
                                            backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                            border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`,
                                            borderRadius: '8px',
                                            color: isDark ? '#F1F5F9' : '#1F2937'
                                        }}
                                    />
                                    <Bar dataKey="orders" fill="#FF6B91" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="delivered" fill="#34D399" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Recent Orders Table */}
                <div className={`rounded-xl overflow-hidden shadow-sm border ${cardBg}`}>
                    <div className={`px-4 sm:px-6 py-4 border-b ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
                        <h3 className={`text-sm sm:text-base font-bold ${textPrimary}`}>
                            {t(tx('Recent Orders', 'الطلبات الأخيرة'))}
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={isDark ? 'bg-slate-800/50' : 'bg-gray-50'}>
                                <tr>
                                    <th className={`px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${textSecondary}`}>
                                        {t(tx('Order ID', 'رقم الطلب'))}
                                    </th>
                                    <th className={`px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${textSecondary}`}>
                                        {t(tx('Customer', 'العميل'))}
                                    </th>
                                    <th className={`px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${textSecondary}`}>
                                        {t(tx('Amount', 'المبلغ'))}
                                    </th>
                                    <th className={`px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${textSecondary}`}>
                                        {t(tx('Status', 'الحالة'))}
                                    </th>
                                    <th className={`px-4 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider ${textSecondary}`}>
                                        {t(tx('Date', 'التاريخ'))}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-slate-700' : 'divide-gray-100'}`}>
                                {recentOrders.map((order) => (
                                    <tr key={order.id} className={`hover:${isDark ? 'bg-slate-800' : 'bg-gray-50'} transition-colors`}>
                                        <td className={`px-4 sm:px-6 py-4 text-sm font-medium ${textPrimary}`}>
                                            #{order.id}
                                        </td>
                                        <td className={`px-4 sm:px-6 py-4 text-sm ${textSecondary}`}>
                                            {order.user?.name || order.customerName || '-'}
                                        </td>
                                        <td className={`px-4 sm:px-6 py-4 text-sm font-semibold ${textPrimary}`}>
                                            {Number(order.totalAmount || 0).toFixed(2)} EGP
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <span className={`
                                                inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                                                ${order.status === 'delivered' ? (isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-700') : 
                                                  order.status === 'shipped' ? (isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700') :
                                                  order.status === 'processing' ? (isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700') :
                                                  (isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-700')}
                                            `}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className={`px-4 sm:px-6 py-4 text-sm ${textSecondary}`}>
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;