import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const DashboardLayout = () => {
    const { language } = useLanguage();
    const { isDark } = useTheme();
    const isRTL = language === 'ar';
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 1024;
        }
        return true;
    });
    
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const isLargeScreen = window.innerWidth >= 1024;
            setIsSidebarOpen(isLargeScreen);
            if (window.innerWidth < 1024) {
                setIsCollapsed(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isSidebarOpen && window.innerWidth < 1024) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isSidebarOpen]);

    const handleToggle = () => {
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(!isSidebarOpen);
        } else {
            setIsCollapsed(!isCollapsed);
        }
    };

    const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';
    const marginClass = isRTL 
        ? (isSidebarOpen ? (isCollapsed ? 'lg:mr-20' : 'lg:mr-64') : 'lg:mr-0')
        : (isSidebarOpen ? (isCollapsed ? 'lg:ml-20' : 'lg:ml-64') : 'lg:ml-0');

    return (
        <div className={`dashboard-shell flex min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
            {/* Sidebar */}
            <Sidebar 
                isOpen={isSidebarOpen} 
                isCollapsed={isCollapsed}
                onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
                onClose={() => setIsSidebarOpen(false)}
            />

            {/* Main Content */}
            <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${marginClass}`}>
                <Navbar 
                    onToggleSidebar={handleToggle} 
                    isSidebarCollapsed={isCollapsed}
                />

                <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto modern-scrollbar transition-colors duration-300">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;