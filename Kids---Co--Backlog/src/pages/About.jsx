import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { fetchStaticPage } from '../api/staticPages';
import { SLUGS } from '../config/slugs';

const About = () => {
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPage = async () => {
      try {
        setLoading(true);
        // Slug aligned with backend CMS (configurable via SLUGS)
        const response = await fetchStaticPage(SLUGS.ABOUT);
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
      <div className="container mx-auto px-4 py-8 flex justify-center items-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <span>Loading content...</span>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-gray-500" dir={isRTL ? 'rtl' : 'ltr'}>
        <p>Content not available</p>
      </div>
    );
  }

  // Select localized content if available
  const localizedContent = language === 'ar' && pageData.contentAr
    ? pageData.contentAr
    : language === 'en' && pageData.contentEn
      ? pageData.contentEn
      : pageData.content;
  // Localized title if available
  const localizedTitle = language === 'ar' && pageData.titleAr ? pageData.titleAr : pageData.title;

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-20 py-8" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className=" mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">{localizedTitle}</h1>
        <div className="max-w-7xl overflow-hidden">
          <div
            className="
                      prose 
                      prose-gray 
                      max-w-none
                      break-words
                      overflow-wrap-anywhere
                      prose-a:break-all
                      prose-pre:whitespace-pre-wrap
                    "
            dangerouslySetInnerHTML={{ __html: localizedContent }}
          />
        </div>

        <div className="mt-8">
          <Link
            to="/shop"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded transition-colors"
          >
            Shop Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About;

