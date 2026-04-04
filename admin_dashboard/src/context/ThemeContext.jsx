import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const THEME_STORAGE_KEY = 'admin_dashboard_theme';

const getInitialTheme = () => {
    if (typeof window === 'undefined') return 'light';
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    // Always start with light mode unless user explicitly selected a theme before.
    return 'light';
};

const ThemeContext = createContext({
    theme: 'light',
    isDark: false,
    toggleTheme: () => {}
});

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.add('transition-colors', 'duration-300');
        if (theme === 'dark') {
            root.classList.add('dark');
            root.style.colorScheme = 'dark';
        } else {
            root.classList.remove('dark');
            root.style.colorScheme = 'light';
        }
        window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }, [theme]);

    const value = useMemo(
        () => ({
            theme,
            isDark: theme === 'dark',
            toggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
        }),
        [theme]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
