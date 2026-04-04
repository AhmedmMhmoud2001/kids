import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import Section from '../components/common/Section';
import BrandsSection from '../components/sections/BrandsSection';
import CategoriesSection from '../components/sections/CategoriesSection';
import BestSellersSection from '../components/sections/BestSellersSection';
import FeaturesSection from '../components/sections/FeaturesSection';
import ProductQuickView from '../components/product/ProductQuickView';
import { fetchCategories } from '../api/categories';
import { fetchBestSellers } from '../api/products';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import 'swiper/css';
import 'swiper/css/pagination';

// Import images
import heroImage1 from '../assets/heroImage1.webp';
import heroImage2 from '../assets/heroImage2.webp';

const Home = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { setAudience } = useApp();
  const { t } = useLanguage();

  useEffect(() => {
    // Set global audience for navigation
    setAudience('KIDS');

    const loadHomeData = async () => {
      try {
        const [catsRes, bestRes] = await Promise.all([
          fetchCategories('KIDS'),
          fetchBestSellers('KIDS')
        ]);
        setCategories(catsRes.data || []);
        setBestSellers(bestRes.data || []);
      } catch (err) {
        console.error("Error loading home data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHomeData();
  }, [setAudience]);




  // Hero slides
  const heroSlides = [
    { id: 1, leftImage: heroImage1, rightImage: heroImage2, title: t('homeHero.shopSmart'), link: '/shop' },
  ];

  return (
    <div className=" container mx-auto ">
      {/* Hero Section */}
      <Section padding="py-4 lg:py-8">
        <div className="rounded-xl overflow-hidden   ">
          {heroSlides.map((slide) => (
            <div key={slide.id}>
              {/* Mobile - Single Image with Text */}
              <div className="block md:hidden relative h-[300px]">
                <img
                  src={slide.rightImage}
                  alt="Kids Fashion"
                  className="w-full h-full object-cover opacity-25"
                  loading="eager"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center px-6">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                      <span className="block text-gray-900 mb-2">{slide.title}</span>
                      <span className="block">
                        <span className="text-gray-900">{t('homeHero.shop')} </span>
                        <span className="text-black">Kids</span>
                        <span className="text-blue-500">&</span>
                        <span className="text-pink-500">Co</span>
                        <span className="text-black">.</span>
                      </span>
                    </h2>
                    <Link
                      to={slide.link}
                      className="inline-block text-black font-bold text-base border-b-3 border-black uppercase tracking-wider"
                    >
                      {t('homeHero.shopNow')}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Desktop - Side by Side */}
              <div className="hidden md:grid md:grid-cols-3 gap-0 relative">
                {/* Left Image */}
                <div className="relative w-[125%] h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] bg-gradient-to-b from-pink-50 to-pink-100">
                  <img
                    src={slide.leftImage}
                    alt="Kids Fashion"
                    className="h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] object-cover object-top"
                    loading="eager"
                  />
                </div>

                {/* Right Image */}
                <div className="relative w-[125%] right-0 top-1/2 -translate-y-1/2 bg-gradient-to-b h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px] from-blue-50 to-blue-100">
                  <div className='h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px]'>
                    <img
                      src={slide.rightImage}
                      alt="Kids Fashion"
                      className="h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px] object-cover object-center opacity-40"
                      loading="eager"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="relative right-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
                  <div>
                    <h2 className="text-1xl sm:text-1xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-2 leading-tight">
                      <span className="block text-gray-800">{slide.title}</span>
                      <span className="block">
                        <span className="text-gray-800">{t('homeHero.shop')} </span>
                        <span className="text-black">Kids</span>
                        <span className="text-blue-500">&</span>
                        <span className="text-pink-500">Co</span>
                        <span className="text-black">.</span>
                      </span>
                    </h2>
                    <div className="mt-4 sm:mt-6 lg:mt-8">
                      <Link
                        to={slide.link}
                        className="inline-block bg-transparent text-black font-bold text-sm sm:text-base lg:text-lg py-2 px-0 border-b-2 sm:border-b-4 border-black hover:border-blue-500 transition-all uppercase tracking-wider"
                      >
                        {t('homeHero.shopNow')}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

        </div>
      </Section>

      {/* Brands Section */}
      <BrandsSection />

      {/* Categories Section */}
      <CategoriesSection categories={categories} />

      {/* Best Sellers Section */}
      <BestSellersSection
        products={bestSellers}
        onProductSelect={setSelectedProduct}
        moreLink="/shop?audience=KIDS"
      />

      {/* Features Section */}
      <FeaturesSection />

      {/* Quick View Modal */}
      {selectedProduct && (
        <ProductQuickView
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );

};
export default Home;
