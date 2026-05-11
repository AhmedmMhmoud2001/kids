import { Link } from 'react-router-dom';
import Section from '../common/Section';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { useId } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

/**
 * Categories section component matching the design with circle background and popping images
 */
const CategoriesSectionHome2 = ({
  categories = [],
  limit = null,
  gridCols = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  className = '',
  pageSize = 6,
  showArrows = true
}) => {
  const { audience } = useApp();
  const { t } = useLanguage();
  const id = useId().replace(/:/g, '');
  const prevClass = `cats2-prev-${id}`;
  const nextClass = `cats2-next-${id}`;

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
    <Section padding="py-8 lg:py-12" className={className}>
      <div dir={isRTL ? 'rtl' : 'ltr'} className="relative">
        {showArrows && shouldUseSwiper ? (
          <>
            <button
              type="button"
              className={`swiper-nav-btn ${prevClass} absolute -left-8 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow border border-gray-200 text-gray-700 hover:bg-white`}
              aria-label="Previous categories"
            >
              ‹
            </button>
            <button
              type="button"
              className={`swiper-nav-btn ${nextClass} absolute -right-8 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow border border-gray-200 text-gray-700 hover:bg-white`}
              aria-label="Next categories"
            >
              ›
            </button>
          </>
        ) : null}
        <Swiper
          modules={[Navigation]}
          slidesPerView={1}
          spaceBetween={0}
          allowTouchMove={shouldUseSwiper}
          navigation={
            showArrows && shouldUseSwiper
              ? { prevEl: `.${prevClass}`, nextEl: `.${nextClass}` }
              : false
          }
        >
          {pages.map((page, pageIndex) => (
            <SwiperSlide key={pageIndex}>
              <div className={`grid ${gridCols} gap-6 md:gap-8`}>
                {page.map((category, idx) => {
                  const categoryPath = category.slug || '';
                  const key = category.id || category.slug || `${pageIndex}-${idx}`;

                  return (
                    <Link
                      key={key}
                      to={`/category/${category.slug || categoryPath}?audience=${audience}`}
                      className="group flex flex-col items-center justify-center text-center cursor-pointer"
                    >
                      {/* Image Container */}
                      <div className="relative w-full aspect-[3/4] flex items-end justify-center mb-6 overflow-visible">
                        {/* Circle Background */}
                        <div className="absolute w-full aspect-square rounded-full bg-[#f3f4f6] group-hover:bg-[#e5e7eb] transition-colors duration-300 bottom-0 z-0" />

                        {/* Product image with hover */}
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={t(category.name)}
                            className="
                    absolute left-1/2 top-10 -translate-x-1/2
                    w-auto h-[115%]
                    object-contain object-center
                    z-10
                    transition-all duration-500 ease-out
                    group-hover:-translate-y-3 group-hover:scale-[1.06]
                    group-hover:z-20
                    group-hover:drop-shadow-[0_18px_20px_rgba(0,0,0,0.18)]
                  "
                            loading="lazy"
                          />
                        ) : null}
                      </div>

                      {/* Category Name */}
                      <h3 className="font-bold text-gray-800 text-lg sm:text-xl group-hover:text-blue-600 transition-colors">
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

export default CategoriesSectionHome2;
