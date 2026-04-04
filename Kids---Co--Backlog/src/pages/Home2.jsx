import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Section from '../components/common/Section';
import BrandsSection from '../components/sections/BrandsSection';
import BestSellersSection from '../components/sections/BestSellersSection';
import FeaturesSection from '../components/sections/FeaturesSection';
import CategoriesSectionHome2 from '../components/sections/CategoriesSectionHome2';
import { fetchCategories } from '../api/categories';
import { fetchBestSellers } from '../api/products';
import { fetchHomeHeroVideo } from '../api/settings';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';

const Home2 = () => {
  const [categories, setCategories] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [heroVideo, setHeroVideo] = useState("https://www.pexels.com/download/video/3917742/");
  const [isLoading, setIsLoading] = useState(true);
  const { setAudience } = useApp();
  const { t } = useLanguage();

  useEffect(() => {
    // Set global audience for navigation
    setAudience('NEXT');

    const loadHome2Data = async () => {
      try {
        const [catsRes, bestRes, videoUrl] = await Promise.all([
          fetchCategories('NEXT'),
          fetchBestSellers('NEXT'),
          fetchHomeHeroVideo()
        ]);
        setCategories(catsRes.data || []);
        setBestSellers(bestRes.data || []);
        setHeroVideo(videoUrl);
      } catch (err) {
        console.error("Error loading home2 data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadHome2Data();
  }, [setAudience]);

  return (
    <div className="container mx-auto">
      {/* Hero Section - Full Width with Overlay Text */}
      <section className="relative w-full h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden">
        {/* Hero Image */}
        <div className="absolute inset-0">
          <video
            src={heroVideo}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/40"></div>
        </div>

        {/* Hero Content */}
        <div className="relative h-full flex items-center justify-center">
          <div className="text-center px-4 sm:px-6 md:px-10 lg:px-20 max-w-4xl">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 md:mb-6 leading-tight">
              Trusted By Parents Loved By Kids
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-6 md:mb-8 lg:mb-10 max-w-2xl mx-auto px-4">
              Our Products Combine High Quality And Reliability, Making Them The Top Choice For Families.
            </p>
            <Link
              to="/shop"
              className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg transition-colors"
            >
              {t('homeHero.shopNow')}
            </Link>
          </div>
        </div>
      </section>


      {/* Categories Section */}
      <CategoriesSectionHome2 categories={categories} />

      {/* Best Sellers Section */}
      <BestSellersSection
        products={bestSellers}
        moreLink="/shop?audience=NEXT"
      />

      {/* Features Section */}
      <FeaturesSection />
    </div>
  );
};

export default Home2;
