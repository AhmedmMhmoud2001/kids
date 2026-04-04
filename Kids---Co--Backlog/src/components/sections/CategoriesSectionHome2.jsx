import { Link } from 'react-router-dom';
import Section from '../common/Section';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Categories section component matching the design with circle background and popping images
 */
const CategoriesSectionHome2 = ({
  categories = [],
  limit = null,
  gridCols = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
  className = ''
}) => {
  const { audience } = useApp();
  const { t } = useLanguage();

  const categoriesToShow = limit ? categories.slice(0, limit) : categories;

  return (
    <Section padding="py-8 lg:py-12" className={className}>
      <div className={`grid ${gridCols} gap-6 md:gap-8`}>
        {categoriesToShow.map((category, idx) => {
          const categoryPath = category.slug || '';

          return (
            <Link
              key={idx}
              to={`/category/${category.slug || categoryPath}?audience=${audience}`}
              className="group flex flex-col items-center justify-center text-center cursor-pointer"
            >
              {/* Image Container */}
              <div className="relative w-full aspect-[3/4] flex items-end justify-center mb-6 overflow-visible">
                {/* Circle Background */}
                <div className="absolute w-full aspect-square rounded-full bg-[#f3f4f6] group-hover:bg-[#e5e7eb] transition-colors duration-300 bottom-0 z-0" />

                {/* Product image with hover */}
                <img
                  src={category.image || null}
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
              </div>

              {/* Category Name */}
              <h3 className="font-bold text-gray-800 text-lg sm:text-xl group-hover:text-blue-600 transition-colors">
                {t(category.name)}
              </h3>
            </Link>
          );
        })}
      </div>
    </Section>
  );
};

export default CategoriesSectionHome2;
