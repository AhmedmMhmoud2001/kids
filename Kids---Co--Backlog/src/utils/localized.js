export function renderLocalized(value, language = 'ar') {
  if (value && typeof value === 'object' && ('en' in value || 'ar' in value)) {
    return value[language] ?? value.en ?? value.ar ?? '';
  }
  if (typeof value !== 'string') {
    return value ?? '';
  }
  return value.replace(
    /\{\s*"en"\s*:\s*"(.*?)"\s*,\s*"ar"\s*:\s*"(.*?)"\s*\}/g,
    (_, enText, arText) => (language === 'ar' ? arText : enText)
  );
}

