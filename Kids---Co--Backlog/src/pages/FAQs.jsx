import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchStaticPage } from '../api/staticPages';
import { SLUGS } from '../config/slugs';
import { useLanguage } from '../context/LanguageContext';

const FAQs = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);
        const response = await fetchStaticPage(SLUGS.FAQS);
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
  // Localized content selection will happen after pageData is loaded
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[400px]" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500">
        </div>
      </div>
    );
  }

  // Localized title fallback for AR/EN
  const localizedTitle = language === 'ar' && pageData?.titleAr ? pageData.titleAr : pageData?.title;

  if (!pageData) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-gray-500" dir={isRTL ? 'rtl' : 'ltr'}>
        {error ? <p>Error loading content.</p> : <p>Page not found.</p>}
      </div>
    );
  }

  // Determine localized content based on current language
  const contentToRender = (
    pageData && language === 'ar' && pageData.contentAr
  ) ? pageData.contentAr : (
    pageData && language === 'en' && pageData.contentEn
  ) ? pageData.contentEn : pageData?.content;
  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-20 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">{localizedTitle}</h1>

        <div
          className="prose prose-lg max-w-none space-y-4"
          dangerouslySetInnerHTML={{ __html: contentToRender }}
        />
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Still have questions?</h2>
          <p className="text-gray-700 mb-4">
            If you can't find the answer you're looking for, please don't hesitate to contact us.
          </p>
          <Link
            to="/contact"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQs;

