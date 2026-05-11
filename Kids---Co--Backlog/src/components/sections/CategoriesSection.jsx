import { Link } from 'react-router-dom';
import Section from '../common/Section';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { useId } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

/**
 * Categories section component
 */
const CategoriesSection = ({
  categories = [],
  limit = null,
  gridCols = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
  className = '',
  pageSize = 6,
  showArrows = true,
  autoPlay = true,
  autoPlayDelayMs = 3500
}) => {
  const { audience } = useApp();
  const { t } = useLanguage();
  const id = useId().replace(/:/g, '');
  const prevClass = `cats-prev-${id}`;
  const nextClass = `cats-next-${id}`;
  const getCategoryClasses = (category) => {
    const slug = String(category.slug || '').toLowerCase();
    const name = String(t(category.name) || '').toLowerCase();
    const isBoy = name.includes('boy');
    const isGirl = name.includes('girl');
    const isBoyBySlug = slug.includes('boy');
    const isGirlBySlug = slug.includes('girl');

    const baseClasses = "text-gray-700 bg-gray-50 border-2 border-gray-100/50 transition-all duration-700 shadow-sm group-hover:shadow-md";

    if (isBoy || isBoyBySlug) {
      return `${baseClasses} hover:bg-blue-50 hover:border-blue-200`;
    }
    if (isGirl || isGirlBySlug) {
      return `${baseClasses} hover:bg-pink-50 hover:border-pink-200`;
    }

    // Categories: smooth gradient on hover
    return `${baseClasses} hover:bg-gradient-to-br hover:from-pink-100/20 hover:to-blue-100/20 hover:border-blue-200`;
  };


  const categoriesToShow = limit ? categories.slice(0, limit) : categories;
  const total = categoriesToShow.length;
  const shouldUseSwiper = total > pageSize;

  const pages = shouldUseSwiper
    ? Array.from({ length: Math.ceil(total / pageSize) }, (_, pageIndex) => {
        const start = pageIndex * pageSize;
        const end = Math.min(start + pageSize, total);
        return categoriesToShow.slice(start, end);
      })
    : [categoriesToShow];

  const isRTL =
    typeof document !== 'undefined' &&
    ((document.documentElement.getAttribute('dir') || 'ltr')?.toLowerCase() === 'rtl');

  return (
    <Section padding="py-4 lg:py-5" className={className}>
      <div dir={isRTL ? 'rtl' : 'ltr'} className="relative">
        {showArrows && shouldUseSwiper ? (
          <>
            <button
              type="button"
              className={`swiper-nav-btn ${prevClass} absolute -left-10 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow border border-gray-200 text-gray-700 hover:bg-white`}
              aria-label="Previous categories"
            >
              ‹
            </button>
            <button
              type="button"
              className={`swiper-nav-btn ${nextClass} absolute -right-10 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow border border-gray-200 text-gray-700 hover:bg-white`}
              aria-label="Next categories"
            >
              ›
            </button>
          </>
        ) : null}
        <Swiper
          key={isRTL ? 'rtl' : 'ltr'}
          modules={[Navigation, Autoplay]}
          slidesPerView={1}
          spaceBetween={0}
          allowTouchMove={shouldUseSwiper}
          autoplay={
            autoPlay && shouldUseSwiper
              ? { delay: autoPlayDelayMs, disableOnInteraction: true, pauseOnMouseEnter: true }
              : false
          }
          navigation={
            showArrows && shouldUseSwiper
              ? { prevEl: `.${prevClass}`, nextEl: `.${nextClass}` }
              : false
          }
        >
          {pages.map((page, pageIndex) => (
            <SwiperSlide key={pageIndex}>
              <div className={`grid ${gridCols} gap-4 lg:gap-6`}>
                {page.map((category, idx) => {
                  const categoryPath = category.slug || '';
                  const key = category.id || category.slug || `${pageIndex}-${idx}`;

                  return (
                    <Link
                      key={key}
                      to={`/category/${category.slug || categoryPath}?audience=${audience}`}
                      className="group text-center hover:text-gray-500"
                    >
                      <div className={`aspect-square  rounded-full overflow-hidden mb-3  shadow-md ${getCategoryClasses(category)}`}>
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={t(category.name)}
                            className="relative w-full h-full object-cover object-center z-10"
                            loading="lazy"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.classList.add('bg-gray-300');
                            }}
                          />
                        ) : null}
                      </div>
                      <h3 className="font-medium text-xs sm:text-sm md:text-base transition-colors">
                        {t(category.name)}
                      </h3>
                    </Link>
                  );
                })}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </Section>
  );
};

export default CategoriesSection;

