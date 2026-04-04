import { useState, useEffect } from 'react';
import { fetchStaticPage } from '../api/staticPages';
import { SLUGS } from '../config/slugs';
import { useLanguage } from '../context/LanguageContext';

const Delivery = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);
        // Slug aligned with backend CMS (configurable via SLUGS)
        const response = await fetchStaticPage(SLUGS.DELIVERY);
        if (response.success) {
          setPageData(response.data);
        } else {
          setError('Failed to load page content');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load page content');
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[400px]" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-gray-500" dir={isRTL ? 'rtl' : 'ltr'}>
        {error ? <p>Error loading content.</p> : <p>Content not available</p>}
      </div>
    );
  }

  const localizedContent = language === 'ar' && pageData.contentAr
    ? pageData.contentAr
    : language === 'en' && pageData.contentEn
      ? pageData.contentEn
      : pageData.content;
  const localizedTitle = language === 'ar' && pageData?.titleAr ? pageData.titleAr : pageData?.title;

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-20 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">{localizedTitle}</h1>

        <div
          className="prose prose-lg max-w-none space-y-6 text-gray-700"
          dangerouslySetInnerHTML={{ __html: localizedContent }}
        />
      </div>
    </div>
  );
};

export default Delivery;

