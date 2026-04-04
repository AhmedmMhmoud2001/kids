import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "../i18n/translations";

const LanguageContext = createContext();

const getNestedValue = (obj, path) =>
  path.split(".").reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), obj);

const parseInlineLocalizedJson = (value) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && ("en" in parsed || "ar" in parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "ar" || saved === "en") return saved;
    return "en";
  });

  useEffect(() => {
    localStorage.setItem("lang", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const t = useMemo(
    () => (key) => {
      if (key && typeof key === "object" && ("en" in key || "ar" in key)) {
        return key[language] || key.en || key.ar || "";
      }
      if (typeof key === "string") {
        const inline = parseInlineLocalizedJson(key);
        if (inline) return inline[language] || inline.en || inline.ar || "";
      }
      if (typeof key !== "string") return key;
      const current = getNestedValue(translations[language], key);
      if (current !== null) return current;
      const fallback = getNestedValue(translations.en, key);
      return fallback !== null ? fallback : key;
    },
    [language]
  );

  const toggleLanguage = () => setLanguage((prev) => (prev === "en" ? "ar" : "en"));

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
