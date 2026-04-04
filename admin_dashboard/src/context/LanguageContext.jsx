import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

const getPathValue = (obj, path) =>
    String(path)
        .split('.')
        .reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);

const parseInlineLocalizedJson = (value) => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null;
    try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object' && ('en' in parsed || 'ar' in parsed)) {
            return parsed;
        }
        return null;
    } catch {
        return null;
    }
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('dashboard_lang');
        return saved === 'ar' || saved === 'en' ? saved : 'en';
    });

    useEffect(() => {
        localStorage.setItem('dashboard_lang', language);
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }, [language]);

    const t = useMemo(
        () => (value) => {
            // Inline bilingual object: t({ en: '...', ar: '...' })
            if (value && typeof value === 'object' && ('en' in value || 'ar' in value)) {
                return value[language] || value.en || value.ar || '';
            }

            // Translation key: t('sidebar.signOut')
            if (typeof value === 'string') {
                // Stored localized JSON string from DB: {"en":"...","ar":"..."}
                const inlineJson = parseInlineLocalizedJson(value);
                if (inlineJson) {
                    return inlineJson[language] || inlineJson.en || inlineJson.ar || '';
                }

                const current = getPathValue(translations[language], value);
                if (current !== undefined) return current;
                const fallback = getPathValue(translations.en, value);
                return fallback !== undefined ? fallback : value;
            }

            return '';
        },
        [language]
    );

    const toggleLanguage = () => setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));

    return (
        <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage must be used within LanguageProvider');
    return context;
};
