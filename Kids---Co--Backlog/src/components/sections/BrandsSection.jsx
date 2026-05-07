import { useState, useEffect } from "react";
import Section from "../common/Section";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { fetchBrands } from "../../api/brands";
import { useLanguage } from "../../context/LanguageContext";

const BrandsSection = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();

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

  if (loading) return null; // Or skeleton
  // If no brands, don't render section
  if (brands.length === 0) return null;

  return (
    <Section padding="py-4 sm:py-5 lg:py-6" className="border-b">
      <Swiper
        key={language}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        modules={[Autoplay]}
        loop={true} // Only loop if enough items
        centeredSlides={false}

        autoplay={{
          delay: 2200,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        breakpoints={{
          0: { slidesPerView: 1, spaceBetween: 16 },      // small mobile
          480: { slidesPerView: 2, spaceBetween: 18 },   // large mobile
          640: { slidesPerView: 2, spaceBetween: 20 },   // sm
          768: { slidesPerView: 3, spaceBetween: 22 },   // md
          1024: { slidesPerView: 4, spaceBetween: 24 },  // lg
          1280: { slidesPerView: 5, spaceBetween: 24 },  // xl
        }}
        className="!pb-2"
      >
        {brands.map((item) => (
          <SwiperSlide
            key={item.id}
            className="!h-auto flex items-center justify-center"
          >
            {/* Fixed container so images align */}
            <div className="h-16 w-full flex items-center justify-center cursor-pointer group px-4">
              <img
                src={item.image || null}
                alt={item.name}
                className="h-full w-full p-3 object-contain filter grayscale opacity-70 hover:grayscale-0 hover:opacity-100 hover:scale-105 transition-all duration-300"
                loading="lazy"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </Section>
  );
};

export default BrandsSection;
