import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import Section from '../common/Section';
import ProductCard from '../product/ProductCard';
import ProductQuickView from '../product/ProductQuickView';
import { useLanguage } from '../../context/LanguageContext';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

/**
 * Best Sellers section component with Swiper carousel
 */
const BestSellersSection = ({
  products = [],
  title = null,
  showMoreLink = true,
  moreLink = '/shop',
  limit = 10,
  className = '',
  onProductSelect
}) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { language, t } = useLanguage();

  const productsToShow = products.slice(0, limit);

  const handleQuickView = (product) => {
    setSelectedProduct(product);
    if (onProductSelect) {
      onProductSelect(product);
    }
  };

  const displayTitle = title || t('bestSellers.title') || 'Best Sellers';
  return (
    <>
      <Section padding="py-4 sm:py-5" className={className}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">{displayTitle}</h2>
          {showMoreLink && (
            <Link
              to={moreLink}
              className="text-blue-500 hover:text-blue-600 font-medium text-sm sm:text-base"
            >
              {t('bestSellers.more') || 'More'}
            </Link>
          )}
        </div>

        {/* Product Carousel with Swiper */}
        <div className="relative best-sellers-swiper">
          <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <Swiper
            key={language}
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            pagination={{
              clickable: true,
              dynamicBullets: true,
            }}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            loop={productsToShow.length > 5}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 24,
              },
              1024: {
                slidesPerView: 4,
                spaceBetween: 24,
              },
              1280: {
                slidesPerView: 5,
                spaceBetween: 24,
              },
            }}
            className="!pb-14"
          >
            {productsToShow.map((product) => (
              <SwiperSlide key={product.id}>
                <ProductCard product={product} onQuickView={handleQuickView} />
              </SwiperSlide>
            ))}
          </Swiper>
          </div>
        </div>
      </Section>

      {/* Quick View Modal */}
      {selectedProduct && (
        <ProductQuickView
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
};

export default BestSellersSection;

