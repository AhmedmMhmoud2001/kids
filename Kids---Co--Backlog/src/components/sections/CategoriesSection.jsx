import { Link } from 'react-router-dom';
import Section from '../common/Section';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Categories section component
 */
const CategoriesSection = ({
  categories = [],
  limit = null,
  gridCols = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
  className = ''
}) => {
  const { audience } = useApp();
  const { t } = useLanguage();
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

  return (
    <Section padding="py-4 lg:py-5" className={className}>
      <div className={`grid ${gridCols} gap-4 lg:gap-6`}>
        {categoriesToShow.map((category, idx) => {
          const categoryPath = category.slug || '';

          return (
            <Link
              key={idx}
              to={`/category/${category.slug || categoryPath}?audience=${audience}`}
              className={`group text-center hover:text-gray-500 }`}
            >
              <div className={`aspect-square  rounded-full overflow-hidden mb-3  shadow-md ${getCategoryClasses(category)}`}>
                <img
                  src={category.image || null}
                  alt={t(category.name)}
                  className="relative w-full h-full object-cover object-center z-10"
                  loading="lazy"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.classList.add('bg-gray-300');
                  }}
                />
              </div>
              <h3 className={`font-medium text-xs sm:text-sm md:text-base transition-colors  `}>
                {t(category.name)}
              </h3>
            </Link>
          );
        })}
      </div>
    </Section>
  );
};

export default CategoriesSection;

