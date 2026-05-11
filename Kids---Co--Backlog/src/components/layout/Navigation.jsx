import { useState, useEffect, useId } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { fetchCategories } from '../../api/categories';
import { useLanguage } from '../../context/LanguageContext';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation as SwiperNavigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

const Navigation = () => {
  const location = useLocation();
  const { audience: contextAudience, setAudience } = useApp();
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const pageSize = 6;
  const id = useId().replace(/:/g, '');
  const prevClass = `navcats-prev-${id}`;
  const nextClass = `navcats-next-${id}`;

  // Read audience from URL query params or use context
  const searchParams = new URLSearchParams(location.search);
  const urlAudience = searchParams.get('audience');
  const audience = urlAudience || contextAudience;

  useEffect(() => {
    const loadCategories = async () => {
      // Determine the effective audience
      const effectiveAudience = urlAudience || contextAudience;

      // Don't load if no audience is available
      if (!effectiveAudience) {

        return;
      }


      setLoading(true);
      try {
        const res = await fetchCategories(effectiveAudience);
        if (res.success) {
          // Map backend categories to include color and path for the UI logic
          const mappedCategories = res.data.map((cat, index) => ({
            ...cat,
            color: String(cat.slug || '').toLowerCase().includes('girl') ? 'pink' :
              String(cat.slug || '').toLowerCase().includes('boy') ? 'blue' :
                index % 2 === 0 ? 'blue' : 'pink',
            path: `/category/${cat.slug}`
          }));
          setCategories(mappedCategories);
        }
      } catch (error) {
        console.error('Error loading navigation categories:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, [urlAudience, contextAudience]); // Depend on both URL and context audience

  const getColorClasses = (category, isActive) => {
    if (isActive) {
      return category.color === 'blue'
        ? 'text-[#63adfc] border-b-2 border-[#63adfc]'
        : 'text-[#ff92a5] border-b-2 border-[#ff92a5]';
    }

    // Default classes (Hover)
    return category.color === 'blue'
      ? 'text-gray-700 hover:text-[#63adfc] border-b-2 border-transparent hover:border-[#63adfc]'
      : 'text-gray-700 hover:text-[#ff92a5] border-b-2 border-transparent hover:border-[#ff92a5]';
  };

  if (loading && categories.length === 0) {
    return (
      <nav className="bg-white border-t hidden lg:block">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-row-reverse justify-center gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-6 w-20 bg-gray-100 animate-pulse rounded"></div>
            ))}
          </div>
        </div>
      </nav>
    );
  }

  const total = categories.length;
  const shouldUseSwiper = total > pageSize;
  const pages = shouldUseSwiper
    ? Array.from({ length: Math.ceil(total / pageSize) }, (_, pageIndex) => {
        const start = pageIndex * pageSize;
        const end = Math.min(start + pageSize, total);
        return categories.slice(start, end);
      })
    : [categories];

  const isRTL =
    typeof document !== 'undefined' &&
    ((document.documentElement.getAttribute('dir') || 'ltr')?.toLowerCase() === 'rtl');

  return (
    <nav className="bg-white border-t hidden lg:block">
      <div className="container mx-auto px-4 sm:px-6 md:px-10 lg:px-20">
        <div dir={isRTL ? 'rtl' : 'ltr'} className="py-4 relative">
          {shouldUseSwiper ? (
            <>
              <button
                type="button"
                className={`swiper-nav-btn ${prevClass} absolute left-0 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow border border-gray-200 text-gray-700 hover:bg-white`}
                aria-label="Previous categories"
              >
                ‹
              </button>
              <button
                type="button"
                className={`swiper-nav-btn ${nextClass} absolute right-0 top-1/2 -translate-y-1/2 z-20 hidden md:flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow border border-gray-200 text-gray-700 hover:bg-white`}
                aria-label="Next categories"
              >
                ›
              </button>
            </>
          ) : null}
          <Swiper
            key={isRTL ? 'rtl' : 'ltr'}
            modules={[SwiperNavigation, Autoplay]}
            slidesPerView={1}
            spaceBetween={0}
            allowTouchMove={shouldUseSwiper}
            autoplay={
              shouldUseSwiper
                ? { delay: 3500, disableOnInteraction: true, pauseOnMouseEnter: true }
                : false
            }
            navigation={
              shouldUseSwiper
                ? { prevEl: `.${prevClass}`, nextEl: `.${nextClass}` }
                : false
            }
          >
            {pages.map((page, pageIndex) => (
              <SwiperSlide key={pageIndex}>
                <ul className="flex items-center justify-center gap-8">
                  {page.map((category) => {
                    // Determine the effective audience for the link
                    const effectiveAudience = urlAudience || contextAudience;

                    // Include audience in query param for the link
                    const targetPath = `${category.path}?audience=${effectiveAudience}`;

                    // Check if this category is active by comparing pathnames
                    const isActive = location.pathname === category.path;

                    return (
                      <li key={category.id || category.path}>
                        <NavLink
                          to={targetPath}
                          className={() =>
                            `font-medium transition-all duration-200 pb-1 whitespace-nowrap ${getColorClasses(category, isActive)}`
                          }
                        >
                          {t(category.name)}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
