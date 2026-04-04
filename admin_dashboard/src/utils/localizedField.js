export const parseLocalizedField = (value) => {
    if (value && typeof value === 'object' && ('en' in value || 'ar' in value)) {
        return {
            en: String(value.en || value.ar || ''),
            ar: String(value.ar || value.en || '')
        };
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (parsed && typeof parsed === 'object' && ('en' in parsed || 'ar' in parsed)) {
                    return {
                        en: String(parsed.en || parsed.ar || ''),
                        ar: String(parsed.ar || parsed.en || '')
                    };
                }
            } catch {
                // Fallback to plain string
            }
        }
        return { en: value, ar: value };
    }

    return { en: '', ar: '' };
};

export const buildLocalizedField = (enValue, arValue) => {
    const en = String(enValue || '').trim();
    const ar = String(arValue || '').trim();
    const finalEn = en || ar;
    const finalAr = ar || en;
    return JSON.stringify({ en: finalEn, ar: finalAr });
};
