// Centralized slugs for static pages to align frontend API calls with backend CMS
// Optional environment overrides (Vite / React app) to adapt to backend slug changes without code changes

function getSlug(envKey, fallback) {
  try {
    // Vite exposes env vars on import.meta.env
    // eslint-disable-next-line no-undef
    const val = (import.meta?.env && import.meta.env[envKey]) || undefined;
    return val ?? fallback;
  } catch {
    return fallback;
  }
}

export const SLUGS = {
  ABOUT: getSlug('VITE_STATIC_PAGE_ABOUT_SLUG', 'about-us'),
  DELIVERY: getSlug('VITE_STATIC_PAGE_DELIVERY_SLUG', 'delivery-return'),
  FAQS: getSlug('VITE_STATIC_PAGE_FAQS_SLUG', 'faq'),
  CONTACT: getSlug('VITE_STATIC_PAGE_CONTACT_SLUG', 'contact'),
  PRIVACY: getSlug('VITE_STATIC_PAGE_PRIVACY_SLUG', 'privacy-policy'),
  TERMS: getSlug('VITE_STATIC_PAGE_TERMS_SLUG', 'terms-conditions'),
};
