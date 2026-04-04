import React from 'react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../context/useApp';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { tx } from '../i18n/text';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    Folder,
    UserCircle,
    LogOut,
    Tag,
    Bell,
    X,
    Percent,
    Settings,
    Video,
    FileText,
    Share2,
    FileSpreadsheet,
    BarChart3,
    ShieldCheck
} from 'lucide-react';

const Sidebar = ({ isOpen, isCollapsed, onToggleCollapse, onClose }) => {
    const { user, logout } = useApp();
    const { t, language } = useLanguage();
    const { isDark } = useTheme();
    const role = user?.role;
    const isRTL = language === 'ar';
    
    const menuItems = [
        {
            title: tx('Dashboard', 'لوحة التحكم'),
            path: '/',
            icon: <LayoutDashboard size={20} />,
            roles: ['SYSTEM_ADMIN'],
            exact: true
        },
        {
            title: tx('Users', 'المستخدمون'),
            path: '/users',
            icon: <Users size={20} />,
            roles: ['SYSTEM_ADMIN']
        },
        {
            title: tx('Categories', 'الأقسام'),
            path: '/categories',
            icon: <Folder size={20} />,
            roles: ['SYSTEM_ADMIN', 'ADMIN_KIDS', 'ADMIN_NEXT']
        },
        {
            title: tx('Our Brands', 'علاماتنا التجارية'),
            path: '/brands',
            icon: <Tag size={20} />,
            roles: ['SYSTEM_ADMIN', 'ADMIN_KIDS']
        },
        {
            title: tx('Kids Products', 'منتجات كيدز'),
            path: '/kids/products',
            icon: <Package size={20} />,
            roles: ['SYSTEM_ADMIN', 'ADMIN_KIDS']
        },
        {
            title: tx('Next Products', 'منتجات نكست'),
            path: '/next/products',
            icon: <Package size={20} />,
            roles: ['SYSTEM_ADMIN', 'ADMIN_NEXT']
        },
        {
            title: tx('Excel (Kids)', 'إكسل (كيدز)'),
            path: '/kids/excel',
            icon: <FileSpreadsheet size={20} />,
            roles: ['SYSTEM_ADMIN', 'ADMIN_KIDS']
        },
        {
            title: tx('Excel (Next)', 'إكسل (نكست)'),
            path: '/next/excel',
            icon: <FileSpreadsheet size={20} />,
            roles: ['SYSTEM_ADMIN', 'ADMIN_NEXT']
        },
        {
            title: tx('Orders', 'الطلبات'),
            path: role === 'SYSTEM_ADMIN' ? '/orders' : (role === 'ADMIN_KIDS' ? '/kids/orders' : '/next/orders'),
            icon: <ShoppingCart size={20} />,
            roles: ['SYSTEM_ADMIN', 'ADMIN_KIDS', 'ADMIN_NEXT']
        },
        {
            title: tx('Coupons', 'الكوبونات'),
            path: '/coupons',
            icon: <Percent size={20} />,
            roles: ['SYSTEM_ADMIN']
        },
        {
            title: tx('Reports', 'التقارير'),
            path: '/reports',
            icon: <BarChart3 size={20} />,
            roles: ['SYSTEM_ADMIN']
        },
        {
            title: tx('RBAC', 'إدارة الصلاحيات'),
            path: '/rbac',
            icon: <ShieldCheck size={20} />,
            roles: ['SYSTEM_ADMIN']
        },
        {
            title: tx('Invoices', 'الفواتير'),
            path: '/invoices',
            icon: <FileText size={20} />,
            roles: ['SYSTEM_ADMIN', 'ADMIN_KIDS', 'ADMIN_NEXT']
        },
        {
            title: tx('Static Content', 'المحتوى الثابت'),
            path: '/static-pages',
            icon: <Folder size={20} />,
            roles: ['SYSTEM_ADMIN']
        },
        {
            title: tx('Notifications', 'الإشعارات'),
            path: '/notifications',
            icon: <Bell size={20} />,
            roles: ['SYSTEM_ADMIN', 'ADMIN_KIDS', 'ADMIN_NEXT']
        },
        {
            title: tx('Contact Messages', 'رسائل التواصل'),
            path: '/contact',
            icon: <Users size={20} />,
            roles: ['SYSTEM_ADMIN', 'ADMIN_KIDS', 'ADMIN_NEXT']
        },
        {
            title: tx('Profile', 'الملف الشخصي'),
            path: '/profile',
            icon: <UserCircle size={20} />,
            roles: ['SYSTEM_ADMIN', 'ADMIN_KIDS', 'ADMIN_NEXT']
        },
        {
            title: tx('Home Settings', 'إعدادات الصفحة الرئيسية'),
            path: '/home-settings',
            icon: <Video size={20} />,
            roles: ['SYSTEM_ADMIN']
        },
        {
            title: tx('Social Links', 'روابط التواصل'),
            path: '/social-links',
            icon: <Share2 size={20} />,
            roles: ['SYSTEM_ADMIN']
        },
        {
            title: tx('Settings', 'الإعدادات'),
            path: '/settings',
            icon: <Settings size={20} />,
            roles: ['SYSTEM_ADMIN']
        }
    ];

    const filteredItems = menuItems.filter(item => item.roles.includes(role));
    const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';

    const sidebarBg = isDark ? 'bg-slate-900' : 'bg-white';
    const borderColor = isDark ? 'border-slate-700' : 'border-gray-200';
    const textPrimary = isDark ? 'text-white' : 'text-gray-800';
    const textSecondary = isDark ? 'text-slate-400' : 'text-gray-500';

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-9998 lg:hidden transition-opacity duration-300"
                    onClick={onClose}
                />
            )}
            
            <aside className={`
                fixed top-0 h-screen flex flex-col shadow-xl z-9999 border-r ${sidebarBg} ${borderColor}
                transition-all duration-300 ease-in-out
                ${isRTL ? 'right-0' : 'left-0'}
                ${sidebarWidth}
                ${isOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')}
                lg:translate-x-0
            `}>
                {/* Logo Section */}
                <div className={`p-4 border-b ${borderColor}`}>
                    <div className="flex items-center gap-3">
                        {/* Logo */}
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-lg">K</span>
                        </div>
                        
                        {/* Title & Role */}
                        <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'opacity-100'}`}>
                            <h1 className={`text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent whitespace-nowrap ${isDark ? 'from-blue-400 to-purple-400' : ''}`}>
                                Kids & Co
                            </h1>
                            <p className={`text-xs uppercase tracking-wider whitespace-nowrap ${textSecondary}`}>
                                {role?.replace('_', ' ')}
                            </p>
                        </div>

                        {/* Mobile Close Button */}
                        <button
                            onClick={onClose}
                            className={`lg:hidden p-1 ml-auto transition-colors ${textSecondary} hover:${textPrimary}`}
                        >
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 modern-scrollbar">
                    <ul className={`space-y-1 ${isCollapsed ? 'px-2' : 'px-3'}`}>
                        {filteredItems.map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    end={item.exact}
                                    onClick={() => {
                                        if (window.innerWidth < 1024) {
                                            onClose();
                                        }
                                    }}
                                    className={({ isActive }) => `
                                        flex items-center gap-3 rounded-lg transition-all duration-200 group
                                        ${isCollapsed ? 'justify-center py-3 px-2' : 'px-3 py-3'}
                                        ${isActive
                                            ? 'bg-blue-600/10 text-blue-600 border border-blue-600/20'
                                            : `${textSecondary} hover:${textPrimary} hover:${isDark ? 'bg-slate-800' : 'bg-gray-100'}`
                                        }
                                    `}
                                >
                                    <div className="flex-shrink-0">{item.icon}</div>
                                    <span className={`font-medium whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}>
                                        {t(item.title)}
                                    </span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Logout Button */}
                <div className={`p-4 border-t ${borderColor} ${isCollapsed ? 'px-2' : ''}`}>
                    <button
                        onClick={logout}
                        className={`
                            flex items-center gap-3 w-full rounded-lg text-red-500 
                            hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors cursor-pointer
                            ${isCollapsed ? 'justify-center py-3 px-2' : 'px-3 py-3'}
                        `}
                    >
                        <LogOut size={20} />
                        <span className={`font-medium whitespace-nowrap transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}>
                            {t('sidebar.signOut')}
                        </span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;