import React from 'react';
import { useApp } from '../context/useApp';
import { Link } from 'react-router-dom';
import { Bell, User, Menu, Sun, Moon, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ onToggleSidebar, isSidebarCollapsed }) => {
    const { user, unreadCount } = useApp();
    const { language, toggleLanguage, t } = useLanguage();
    const { isDark, toggleTheme } = useTheme();

    return (
        <header className={`
            h-16 sticky top-0 z-50 px-4 md:px-6 flex items-center justify-between transition-all duration-300
            ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}
            border-b
        `}>
            {/* Left side - Toggle Button */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onToggleSidebar}
                    className={`
                        p-2 rounded-lg border flex items-center justify-center shadow-sm hover:shadow-md hover:border-blue-400 hover:bg-blue-50 transition-all duration-200
                        ${isDark 
                            ? 'border-slate-600 bg-slate-800 hover:bg-slate-700' 
                            : 'border-gray-200 bg-white'
                        }
                    `}
                    title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <Menu size={20} className={isDark ? 'text-slate-300' : 'text-gray-600'} />
                </button>
            </div>

            {/* Right side - Theme, Language, Notifications, User */}
            <div className="flex items-center gap-2">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className={`
                        p-2 rounded-lg border flex items-center justify-center shadow-sm hover:shadow-md hover:border-blue-400 hover:bg-blue-50 transition-all duration-200
                        ${isDark 
                            ? 'border-slate-600 bg-slate-800 hover:bg-slate-700' 
                            : 'border-gray-200 bg-white'
                        }
                    `}
                    title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                    {isDark ? (
                        <Sun size={18} className="text-amber-500" />
                    ) : (
                        <Moon size={18} className="text-slate-600" />
                    )}
                </button>

                {/* Language Toggle - Icon */}
                <button
                    onClick={toggleLanguage}
                    className={`
                        p-2 rounded-lg border flex items-center justify-center shadow-sm hover:shadow-md hover:border-blue-400 hover:bg-blue-50 transition-all duration-200
                        ${isDark 
                            ? 'border-slate-600 bg-slate-800 hover:bg-slate-700' 
                            : 'border-gray-200 bg-white'
                        }
                    `}
                    title={t('common.language')}
                >
                    <Globe size={18} className={isDark ? 'text-slate-300' : 'text-gray-600'} />
                </button>

                {/* Notifications */}
                <Link 
                    to="/notifications" 
                    className={`
                        relative p-2 rounded-full transition-colors
                        ${isDark 
                            ? 'text-slate-300 hover:bg-slate-800' 
                            : 'text-gray-500 hover:bg-gray-100'
                        }
                    `}
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className={`
                            absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 
                            ${isDark ? 'border-slate-900' : 'border-white'}
                            flex items-center justify-center
                        `}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Link>

                <div className={`h-8 w-px mx-1 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}></div>

                {/* User Profile - Clickable Link */}
                <Link to="/profile" className="flex items-center gap-3 pl-2 hover:opacity-80 transition-opacity">
                    <div className="text-right hidden md:block">
                        <p className={`text-sm font-semibold leading-tight ${isDark ? 'text-slate-100' : 'text-gray-800'}`}>
                            {user?.name || t('navbar.adminUser')}
                        </p>
                        <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            {user?.role?.replace('_', ' ')}
                        </p>
                    </div>
                    <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center border shadow-sm ring-2
                        ${isDark 
                            ? 'bg-gradient-to-tr from-blue-900/40 to-purple-900/40 border-slate-800 ring-slate-800' 
                            : 'bg-gradient-to-tr from-blue-100 to-purple-100 border-white ring-gray-50'
                        }
                    `}>
                        <User size={20} className={isDark ? 'text-blue-300' : 'text-blue-600'} />
                    </div>
                </Link>
            </div>
        </header>
    );
};

export default Navbar;