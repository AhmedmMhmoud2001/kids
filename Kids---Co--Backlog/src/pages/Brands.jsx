import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchBrands } from '../api/brands';
import { useLanguage } from '../context/LanguageContext';

const Brands = () => {
  const { t } = useLanguage();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const res = await fetchBrands();
        if (res.success) {
          setBrands(res.data);
        }
      } catch (err) {
        console.error("Error loading brands:", err);
      } finally {
        setLoading(false);
      }
    };
    loadBrands();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-gray-500">{t('brandsPage.loading')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-20 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">{t('brandsPage.title')}</h1>
        <p className="text-gray-700 mb-8 text-lg">
          {t('brandsPage.intro')}
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {brands.map((brand, index) => (
            <div key={brand.id || index} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow flex flex-col items-center text-center">
              {brand.image && (
                <div className="h-24 w-full flex items-center justify-center mb-4">
                  <img src={brand.image} alt={t(brand.name)} className="h-full object-contain" />
                </div>
              )}
              <div className="mb-2">
                <h2 className="text-xl font-bold text-gray-900">{t(brand.name)}</h2>
              </div>
              <p className="text-gray-600 leading-relaxed text-sm line-clamp-3">{t(brand.description || t('brandsPage.noDescription'))}</p>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">{t('brandsPage.shopByBrand')}</h2>
          <p className="text-gray-700 mb-6">
            {t('brandsPage.shopByBrandText')}
          </p>
          <Link
            to="/shop"
            className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-8 rounded-lg transition-colors"
          >
            {t('brandsPage.viewAllProducts')}
          </Link>
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">{t('brandsPage.whyChoose')}</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">{t('brandsPage.authenticTitle')}</h3>
              <p className="text-gray-600">{t('brandsPage.authenticText')}</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2h-4.586a1 1 0 01-.707-.293l-4.414-4.414A1 1 0 006.586 1H4a2 2 0 00-2 2v16a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">{t('brandsPage.qualityTitle')}</h3>
              <p className="text-gray-600">{t('brandsPage.qualityText')}</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">{t('brandsPage.pricesTitle')}</h3>
              <p className="text-gray-600">{t('brandsPage.pricesText')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Brands;

